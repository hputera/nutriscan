import {installCatalogs} from "../lib/catalog.ts";
import {FOODS,CATALOG_METADATA} from "../lib/catalog-expanded.ts";
import {FOODS as V3,CATALOG_METADATA as V3_META} from "../lib/catalog-seed.ts";
import {FOODS as V2,CATALOG_METADATA as V2_META} from "../lib/catalog-v2.ts";
import {LEGACY_FOODS} from "../lib/catalog-legacy.ts";
installCatalogs([{version:"personal-v4",foods:FOODS,metadata:CATALOG_METADATA},{version:"personal-v3",foods:V3,metadata:V3_META},{version:"tkpi-2020-v2",foods:V2,metadata:V2_META},{version:"demo-v1",foods:LEGACY_FOODS,metadata:{source:"Estimasi awal"}}]);
