import "./load-catalog.ts";
import assert from "node:assert/strict";
import {test} from "node:test";
import {bmiFor,planFor,recommendations,dayTotals,jakartaDay,localMealTime} from "../lib/personal.ts";
import {profileSchema,submissionSchema} from "../lib/validation.ts";
import {FOODS,matchFoodId} from "../lib/catalog.ts";
import {MENU_TEMPLATES} from "../lib/menu-seed.ts";
import type {MenuTemplate} from "../lib/types.ts";
const menus=JSON.parse(JSON.stringify(MENU_TEMPLATES)) as MenuTemplate[];
import {reportPayload} from "../lib/report.ts";
import type {UserProfile,Submission} from "../lib/types.ts";
const profile:UserProfile={name:"Uji",age:30,sex:"male",heightCm:175,weightKg:70,activity:"low",goal:"maintain",preference:"all",allergies:[],restrictions:"",specialCare:false};
const zero={calories:0,protein:0,carbs:0,fat:0,fiber:0};
test("Mifflin formula, explicit activity assumptions and 20/50/30 target conversion",()=>{
 const p=planFor(profile);assert.equal(p.rest,1649);assert.equal(p.maintenance,2308);assert.equal(p.targets?.calories,2310);assert.equal(p.targets?.protein,116);assert.equal(p.targets?.carbs,289);assert.equal(p.targets?.fat,77);assert.equal(p.targets?.fiber,32);
 assert.ok(Math.abs(bmiFor(profile).value-22.857142857)<1e-8);
 assert.equal(planFor({...profile,sex:"female"}).rest,1483);
});
test("BMI categories use unrounded boundaries and avoid adult category at 17-19",()=>{
 assert.equal(bmiFor({age:30,heightCm:200,weightKg:74}).label,"Rentang berat badan sehat");
 assert.equal(bmiFor({age:30,heightCm:200,weightKg:100}).label,"Berat badan berlebih");
 assert.equal(bmiFor({age:30,heightCm:200,weightKg:120}).label,"Rentang obesitas");
 assert.match(bmiFor({...profile,age:18}).label,/mulai usia 20/);
});
test("personal target is withheld for special care and unsupported age; underweight does not get a deficit",()=>{
 assert.equal(planFor({...profile,specialCare:true}).targets,null);
 assert.equal(planFor({...profile,age:16}).targets,null);
 assert.equal(planFor({...profile,age:79}).targets,null);
 const p={...profile,heightCm:180,weightKg:50};assert.deepEqual(planFor({...p,goal:"lose"}).targets,planFor(p).targets);
 const large={...profile,weightKg:100,heightCm:170};assert.deepEqual(planFor({...large,goal:"gain"}).targets,planFor(large).targets);
});
test("recommendations exclude allergens and animal foods for vegan users",()=>{
 const p={...profile,preference:"vegan" as const,allergies:["Kedelai","Gandum/gluten","Susu"]};const r=recommendations(p,zero,planFor(p).targets,menus);assert.ok(r.items.length>0);
 assert.ok(r.items.every(i=>{const m=menus.find(m=>m.id===i.id)!;return m.diet==="vegan"&&!m.allergens.some(a=>p.allergies.includes(a));}));
 assert.equal(recommendations({...p,restrictions:"pantangan khusus"},zero,planFor(p).targets,menus).items.length,0);
 assert.equal(recommendations(p,zero,null).items.length,0);
});
test("reaching energy estimate never suggests additional calories",()=>{
 const t=planFor(profile).targets!;const r=recommendations(profile,{...t,calories:t.calories+200},t,menus);assert.match(r.message,/bukan tambahan otomatis/);assert.equal(r.items.length,0);
});
test("WIB day totals count stored meals once, use their catalog version, and exclude undated legacy records",()=>{
 const r:Submission={id:"a",createdAt:"2026-10-29T00:00:00Z",analysis:{items:[{foodId:"nasi",label:"Nasi",grams:100}],summary:"",source:"manual",title:"Makanan"},image:null,catalogVersion:"demo-v1",meal:{eatenAt:"2026-10-28T18:00:00Z",mealType:"dinner",targets:zero}};
 const old={...r,id:"old",meal:undefined};const tomorrow={...r,id:"tomorrow",catalogVersion:"personal-v3" as const,meal:{...r.meal!,eatenAt:"2026-10-29T17:00:00Z"}};
 const total=dayTotals([r,old,tomorrow],"2026-10-29");assert.equal(total.meals.length,1);assert.equal(total.nutrients.calories,175);
 assert.equal(jakartaDay(new Date("2026-10-29T17:00:00Z")),"2026-10-30");assert.equal(localMealTime("2026-10-29T17:00:00Z"),"2026-10-30T00:00");
});
test("adult profile and personal report validate without any school or price fields",()=>{
 assert.equal(profileSchema.safeParse({...profile,age:16}).success,false);assert.equal(profileSchema.safeParse({...profile,heightCm:0}).success,false);assert.equal(profileSchema.safeParse({...profile,allergies:["unmapped"]}).success,false);
 const result=submissionSchema.parse({id:"f5c6f354-c3ac-4d65-b19d-3d51741a09ec",createdAt:"2026-10-29T12:00:00Z",analysis:{items:[],source:"manual",title:"Makanan",summary:""},catalogVersion:"personal-v3",reportVersion:2,meal:{eatenAt:"2026-10-29T12:00:00Z",mealType:"lunch",targets:planFor(profile).targets}});
 assert.ok("meal" in result);assert.equal("settings" in result,false);
});
test("expanded catalog separates general fruit estimates from variety-specific reference and contains no prices",()=>{
 assert.equal(FOODS.length,78);assert.equal(matchFoodId("pisang-umum","Pisang"),"pisang-umum");assert.equal(matchFoodId("pisang","Pisang"),null);assert.equal(matchFoodId("pisang-umum","Pisang goreng"),null);assert.equal(matchFoodId("apel","Jus apel"),null);
 assert.ok(FOODS.every(f=>f.ingredients.length===0));
 for(const id of ["semangka","melon","jagung-rebus"]){const f=FOODS.find(f=>f.id===id)!;assert.equal(f.nutritionReference?.status,"reference");}
});

test("Neon personal payload excludes body profile, photos, school and all price data",()=>{
 const data=submissionSchema.parse({id:"f5c6f354-c3ac-4d65-b19d-3d51741a09ec",createdAt:"2026-10-29T12:00:00Z",analysis:{items:[{foodId:"nasi",label:"Nasi",grams:150}],source:"manual",title:"Makanan",summary:""},catalogVersion:"personal-v3",reportVersion:2,meal:{eatenAt:"2026-10-29T12:00:00Z",mealType:"lunch",targets:planFor(profile).targets,profile}});
 const payload=reportPayload(data);const text=JSON.stringify(payload);
 for(const key of ["weightKg","heightCm","allergies","school","price","cost","image","Uji"])assert.equal(text.includes(key),false,key);
 assert.ok("nutrients" in payload);assert.equal(payload.nutrients?.calories,270);
});

test("all calorie bands are offered when budget allows, and every choice fits exactly in remaining calories",()=>{
 const targets=planFor(profile).targets!;
 for(const remaining of [0,1,100,149,175,399,400,500,649,650,800,1000,2000]){
  const r=recommendations(profile,{...zero,calories:targets.calories-remaining},targets,menus);
  assert.ok(r.items.every(m=>m.nutrients.calories<=remaining));
  for(const g of r.groups)assert.ok(g.items.every(m=>m.nutrients.calories>=g.min&&m.nutrients.calories<g.max));
 }
 const r=recommendations(profile,zero,targets,menus);assert.ok(r.groups.every(g=>g.items.length>0));
});
test("unmatched daily foods block menu budgeting instead of claiming a false remaining allowance",()=>{
 assert.equal(recommendations(profile,zero,planFor(profile).targets,menus,true).items.length,0);
});

test("unavailable target is distinct from exhausted calories and shows the actual profile reason",()=>{
 for(const p of [{...profile,age:16},{...profile,specialCare:true},{...profile,age:100}]){
  const plan=planFor(p);const r=recommendations(p,zero,plan.targets,menus);
  assert.equal(r.remaining,null);assert.equal(r.groups.length,0);assert.equal(r.message,plan.reason);
 }
 const target=planFor(profile).targets!;const exhausted=recommendations(profile,{...target},target,menus);
 assert.equal(exhausted.remaining,0);assert.equal(exhausted.groups.length,0);assert.match(exhausted.message,/sudah tercapai/);
 const partial=recommendations(profile,zero,target,menus,true);assert.equal(partial.remaining,null);assert.equal(partial.groups.length,0);
});

test("new food saves reduce the same day's allowance, replacement and deletion do not double count",()=>{
 const make=(id:string,foodId:string,grams:number,day="2026-10-30T05:00:00Z"):Submission=>({id,createdAt:day,image:null,catalogVersion:"personal-v4",analysis:{items:[{foodId,label:foodId,grams}],source:"manual",title:"Uji",summary:""},meal:{eatenAt:day,mealType:"lunch",targets:zero}});
 const target=planFor(profile).targets!;const first=make("a","mi-bakso",100);const second=make("b","rendang-sapi",100);
 const allowance=(records:Submission[])=>{const daily=dayTotals(records,"2026-10-30");return recommendations(profile,daily.nutrients,target,menus,daily.unmatched>0).remaining;};
 assert.equal(allowance([]),target.calories);assert.equal(allowance([first]),target.calories-114);assert.equal(allowance([first,second]),target.calories-307);
 assert.equal(allowance([{...first,analysis:{...first.analysis,items:[{foodId:"mi-bakso",label:"Mi bakso",grams:200}]}},second]),target.calories-421);
 assert.equal(allowance([second]),target.calories-193);
 assert.equal(allowance([first,make("other-day","rendang-sapi",100,"2026-10-31T05:00:00Z")]),target.calories-114);
 assert.equal(allowance([first,make("unknown","not-in-catalog",100)]),null);
});

test("age 17 profile activates growth-energy targets without automatic weight-loss adjustments",()=>{
 for(const age of [17,18]){
  const parsed=profileSchema.parse({...profile,age,goal:"lose"});assert.equal(parsed.goal,"maintain");
  const plan=planFor(parsed);assert.ok(plan.targets);assert.equal(plan.rest,null);assert.equal(plan.reason,"");assert.equal(plan.isAdolescent,true);
  for(const goal of ["maintain","lose","gain"] as const)assert.deepEqual(planFor({...parsed,goal}).targets,plan.targets);
  const ideas=recommendations(parsed,zero,plan.targets,menus);assert.equal(ideas.remaining,plan.targets!.calories);assert.ok(ideas.items.length>0);
  assert.equal(planFor({...parsed,specialCare:true}).targets,null);assert.match(bmiFor(parsed).label,/mulai usia 20/);
 }
 assert.equal(profileSchema.safeParse({...profile,age:16}).success,false);assert.equal(planFor({...profile,age:16}).targets,null);
 assert.equal(planFor({...profile,age:19}).isAdolescent,false);
});
test("adolescent EER has sex-specific equations for all four activity categories with height in cm",()=>{
 const male=[2830,3030,3340,3730],female=[2030,2260,2400,2720];
 for(const [i,activity] of (["low","light","moderate","high"] as const).entries()){
  assert.equal(planFor({...profile,age:17,activity}).targets?.calories,male[i]);
  assert.equal(planFor({...profile,age:17,sex:"female",heightCm:165,weightKg:55,activity}).targets?.calories,female[i]);
 }
 assert.equal(planFor({...profile,age:18}).targets?.calories,2840);
});
