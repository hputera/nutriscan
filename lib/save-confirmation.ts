import type {Submission} from "./types.ts";
export type SaveAcknowledgement={revision:number;photoStored:boolean;image:string|null;photoPending:boolean};
function sameMeal(a:Submission,b:Submission){
 const shape=(r:Submission)=>[r.catalogVersion,r.analysis.title,r.analysis.summary,r.analysis.source,r.analysis.items.map(i=>[i.foodId,i.label,i.grams,Boolean(i.uncertain)]),r.meal?.eatenAt,r.meal?.mealType,r.meal?[r.meal.targets.calories,r.meal.targets.protein,r.meal.targets.carbs,r.meal.targets.fat,r.meal.targets.fiber]:null];
 return a.id===b.id&&JSON.stringify(shape(a))===JSON.stringify(shape(b));
}
// A failed response does not prove the write failed. Reconcile the SAME draft ID.
export async function saveWithConfirmation(record:Submission,io:{save:()=>Promise<SaveAcknowledgement>;load:()=>Promise<Submission[]>;confirm:(ack:SaveAcknowledgement)=>void;hasPhoto:boolean}){
 let ack:SaveAcknowledgement;let recovered=false;
 try{ack=await io.save();}
 catch(error){
  let rows:Submission[];try{rows=await io.load();}catch{throw error;}
  const existing=rows.find(r=>sameMeal(r,record));if(!existing)throw error;
  ack={revision:existing.revision??1,photoStored:Boolean(existing.photoStored),image:existing.image,photoPending:io.hasPhoto&&!existing.photoStored};recovered=true;
 }
 io.confirm(ack);
 if(recovered)return {ack,recovered,refreshFailed:false};
 try{await io.load();return {ack,recovered,refreshFailed:false};}
 catch{return {ack,recovered,refreshFailed:true};}
}
