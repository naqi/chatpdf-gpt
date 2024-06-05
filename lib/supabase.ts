import { createClient } from '@supabase/supabase-js'
import credentials from "@/utils/credentials";

export type Document = {
  id: string
  name?: string
  url: string
}
export const supabaseClient = () => {
  const supabase = createClient(credentials.supabaseUrl, credentials.supabaseKey)
  return supabase
}
export const uploadToSubabase = async (file: any) => {
  // @ts-ignore
  const supabase = supabaseClient();
    const { data, error } = await supabase
      .storage
      .from(credentials.supabaseBucket)
      .upload(`${Date.now()}.pdf`, file, {
        cacheControl: '3600',
        upsert: false
      })
    if (error) {
      console.log(error)
      return
    }
    return data
  }
