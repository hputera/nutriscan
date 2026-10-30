export async function responseData(response:Response){
 let data:Record<string,unknown>|null=null;
 try{const value:unknown=await response.json();if(value&&typeof value==="object"&&!Array.isArray(value))data=value as Record<string,unknown>;}catch{}
 if(!response.ok)throw new Error(typeof data?.error==="string"?data.error:response.status===413?"Foto atau data terlalu besar untuk dikirim. Pilih foto yang lebih kecil.":`Permintaan belum berhasil (HTTP ${response.status}). Coba lagi sebentar.`);
 if(!data)throw new Error("Jawaban server belum lengkap. Coba muat ulang data.");
 return data;
}
