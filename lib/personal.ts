import type { UserProfile, Nutrients, Submission, MealType, MenuTemplate } from "./types.ts";
import {adolescentEnergy} from "./adolescent-energy.ts";
import { FOODS } from "./catalog.ts";
import { summarize, versionForRecord } from "./nutrition.ts";
export const MEALS:Record<MealType,string>={breakfast:"Sarapan",lunch:"Makan siang",dinner:"Makan malam",snack:"Camilan"};
export const ACTIVITIES={low:{label:"Lebih banyak duduk",factor:1.4},light:{label:"Aktivitas ringan",factor:1.6},moderate:{label:"Aktif bergerak",factor:1.8},high:{label:"Aktivitas fisik tinggi",factor:2}};
export const GOALS={maintain:"Menjaga berat badan",lose:"Menurunkan berat badan",gain:"Menambah berat badan"};
export const ALLERGIES=["Susu","Telur","Kedelai","Gandum/gluten","Kacang tanah","Kacang pohon","Ikan","Kerang/udang"];
export function jakartaDay(date=new Date()){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);}
export function localMealTime(iso:string){return new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(iso)).replace(" ","T");}
export function bmiFor(p:Pick<UserProfile,"weightKg"|"heightCm"|"age">){
 const value=p.weightKg/(p.heightCm/100)**2;
 const label=p.age<20?"Kategori dewasa berlaku mulai usia 20":value<18.5?"Berat badan kurang":value<25?"Rentang berat badan sehat":value<30?"Berat badan berlebih":"Rentang obesitas";
 return {value,label};
}
export function planFor(p:UserProfile){
 const bmi=bmiFor(p);const isAdolescent=p.age>=17&&p.age<19;
 const rest=p.age>=19?10*p.weightKg+6.25*p.heightCm-5*p.age+(p.sex==="male"?5:-161):null;
 const maintenance=isAdolescent?adolescentEnergy(p):(rest??0)*ACTIVITIES[p.activity].factor;
 let reason=p.specialCare?"Perhitungan dan menu personal tidak ditampilkan untuk kehamilan, menyusui, atau kebutuhan diet khusus. Gunakan arahan tenaga kesehatan.":p.age<17||p.age>78?"Target personal tersedia untuk usia 17–78 tahun; di luar rentang ini diperlukan peninjauan terpisah.":"";
 const goalAllowed=p.age>=19&&!(p.goal==="lose"&&bmi.value<18.5)&&!(p.goal==="gain"&&bmi.value>=30);
 const adjustment=goalAllowed?(p.goal==="lose"?.9:p.goal==="gain"?1.1:1):1;
 const energy=Math.round(maintenance*adjustment/10)*10;
 if(!reason&&(energy<1500||energy>4500))reason="Hasil perkiraan berada di luar rentang target prototype. Tinjau kebutuhan bersama ahli gizi.";
 const targets:Nutrients={calories:energy,protein:Math.round(energy*.2/4),carbs:Math.round(energy*.5/4),fat:Math.round(energy*.3/9),fiber:Math.round(energy*14/1000)};
 return {bmi:p.specialCare?{...bmi,label:"BMI memerlukan interpretasi khusus"}:bmi,isAdolescent,rest:rest===null?null:Math.round(rest),maintenance:Math.round(maintenance),targets:reason?null:targets,reason,goalNote:isAdolescent?"Usia 17–18 memakai perkiraan kebutuhan energi untuk pertumbuhan; aplikasi tidak menerapkan defisit atau surplus otomatis.":goalAllowed?"Penyesuaian tujuan ±10% adalah asumsi awal prototype, bukan resep diet atau janji perubahan berat badan.":"Tujuan ini perlu ditinjau; aplikasi memakai perkiraan pemeliharaan tanpa penyesuaian."};
}
export function dayTotals(records:Submission[],day:string){
 const meals=records.filter(r=>r.meal&&jakartaDay(new Date(r.meal.eatenAt))===day);
 const nutrients:Nutrients={calories:0,protein:0,carbs:0,fat:0,fiber:0};let unmatched=0;
 for(const r of meals){const t=summarize(r.analysis.items,versionForRecord(r));unmatched+=t.unmatched;for(const k of Object.keys(nutrients) as (keyof Nutrients)[])nutrients[k]+=t.nutrients[k];}
 return {meals,nutrients,unmatched};
}
export const CALORIE_BANDS=[{key:"low",label:"Rendah kalori",min:0,max:400},{key:"medium",label:"Sedang kalori",min:400,max:650},{key:"high",label:"Tinggi kalori",min:650,max:Infinity}] as const;
export function recommendations(p:UserProfile,actual:Nutrients,targets:Nutrients|null,menus:MenuTemplate[]=[],incomplete=false){
 const remaining=targets?Math.max(0,targets.calories-actual.calories):0;
 const groups=CALORIE_BANDS.map(b=>({...b,items:[] as {id:string;name:string;items:{foodId:string;label:string;grams:number}[];nutrients:Nutrients;reason:string;estimated:boolean}[]}));
 const result=(message:string,ready=true)=>({message,remaining:ready&&targets?remaining:null,groups:ready&&targets&&remaining>0?groups:[],items:groups.flatMap(g=>g.items)});
 if(!targets)return result(planFor(p).reason||"Lengkapi profil agar target dan rekomendasi personal dapat ditampilkan.",false);
 if(incomplete)return result("Ada makanan yang belum dihitung dalam catatan harian. Koreksi dulu agar sisa kalori tidak menyesatkan.",false);
 if(p.restrictions.trim())return result("Ada pantangan tambahan yang perlu ditinjau manual. Menu otomatis belum ditampilkan.",false);
 if(remaining<=0)return result("Target perkiraan hari ini sudah tercapai. Menu tambahan tidak ditampilkan; tetap makan teratur sesuai kebutuhan dan tinjau porsi sebagai pengganti, bukan tambahan otomatis.");
 const allowed=menus.filter(m=>!m.allergens.some(a=>p.allergies.includes(a))&&(p.preference==="all"||p.preference==="vegetarian"?p.preference!=="vegetarian"||m.diet!=="all":m.diet==="vegan"));
 const focus=actual.protein<targets.protein*.7?"protein":"fiber";
 const choices=allowed.map(m=>{const items=m.items.map(([id,grams])=>({foodId:id,label:FOODS.find(f=>f.id===id)?.name??id,grams}));const t=summarize(items);return {...m,items,nutrients:t.nutrients,unmatched:t.unmatched};}).filter(m=>!m.unmatched&&m.nutrients.calories>0&&m.nutrients.calories<=remaining);
 for(const band of groups){band.items=choices.filter(m=>m.nutrients.calories>=band.min&&m.nutrients.calories<band.max).sort((a,b)=>b.nutrients[focus]-a.nutrients[focus]).slice(0,2).map(m=>({id:m.id,name:m.name,items:m.items,nutrients:m.nutrients,reason:focus==="protein"?"Memuat sumber protein dan tetap muat dalam sisa kalori tercatat.":"Membantu variasi dan serat, dengan porsi yang muat dalam sisa kalori tercatat.",estimated:m.items.some(i=>FOODS.find(f=>f.id===i.foodId)?.nutritionReference?.status!=="reference")}));}
 return result(choices.length?"Pilih satu menu sebagai alternatif, bukan seluruh pilihan sekaligus. Kategori per porsi: rendah <400, sedang 400–<650, tinggi ≥650 kkal; pembagian contoh, bukan standar klinis.":"Belum ada porsi menu di katalog yang sesuai sisa kalori dan batasanmu. Jangan melewatkan makan; tinjau kembali catatan dan porsi.");
}
