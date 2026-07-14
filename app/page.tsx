import { redirect } from "next/navigation";
import { supabase } from "./lib/supabase";

export default function Home() {
  redirect("/dashboard");
}

const { data, error } = await supabase.from("coupons").select("*");
console.log(data, error);