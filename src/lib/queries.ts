import { queryOptions } from "@tanstack/react-query";
import { listProducts } from "@/lib/public.functions";

export const productsQuery = queryOptions({ queryKey: ["products"], queryFn: () => listProducts() });
