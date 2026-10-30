import type {UserProfile} from "./types.ts";
// DRI Energy 2023 / Health Canada, age 14 to <19. Height cm, weight kg,
// age years; +20 kcal/day is the source's growth allowance for both sexes.
export const ADOLESCENT_ENERGY_SOURCE="https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html";
const coefficients={
 male:{low:[-447.51,3.68,13.01,13.15],light:[19.12,3.68,8.62,20.28],moderate:[-388.19,3.68,12.66,20.46],high:[-671.75,3.68,15.38,23.25]},
 female:{low:[55.59,-22.25,8.43,17.07],light:[-297.54,-22.25,12.77,14.73],moderate:[-189.55,-22.25,11.74,18.34],high:[-709.59,-22.25,18.22,14.25]}
} as const;
export function adolescentEnergy(p:Pick<UserProfile,"age"|"sex"|"heightCm"|"weightKg"|"activity">){
 if(p.age<17||p.age>=19)throw new Error("Rumus remaja aplikasi hanya untuk usia 17–18 tahun.");
 const [constant,age,height,weight]=coefficients[p.sex][p.activity];
 return constant+age*p.age+height*p.heightCm+weight*p.weightKg+20;
}
