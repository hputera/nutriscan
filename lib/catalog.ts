import {resolveFoodId} from "./food-matching.ts";
import type { CatalogVersion,FoodProfile } from "./types.ts";
export const CURRENT_CATALOG_VERSION:CatalogVersion="personal-v4";
export type CatalogBundle={version:CatalogVersion;foods:FoodProfile[];metadata:Record<string,unknown>};
export let FOODS:FoodProfile[]=[];
export let CATALOG_METADATA={version:CURRENT_CATALOG_VERSION,source:"Katalog Neon",referenceCount:0,totalFoods:0,validated:false,nutritionUrl:"https://repository.kemkes.go.id/book/668"};
const versions=new Map<CatalogVersion,CatalogBundle>();
export function installCatalogs(bundles:CatalogBundle[]){
 for(const b of bundles)versions.set(b.version,b);
 const current=versions.get(CURRENT_CATALOG_VERSION);
 if(!current?.foods.length)throw new Error("Katalog nutrisi belum tersedia di Neon.");
 FOODS=current.foods;CATALOG_METADATA={...CATALOG_METADATA,...current.metadata,totalFoods:FOODS.length,referenceCount:FOODS.filter(f=>f.nutritionReference?.status==="reference").length};
}
export function catalogFoods(version:CatalogVersion){return versions.get(version)?.foods??[];}
export function catalogMetadata(version:CatalogVersion){return versions.get(version)?.metadata??{source:"Katalog belum dimuat"};}
export function matchFoodId(id:string|null,label:string){return resolveFoodId(FOODS,id,label);}
