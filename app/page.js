'use client'
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();  

  function mudaPagina() {
    router.push('/contas');
  }


  return (
    <div>
      <button
       onClick={() => mudaPagina()} 
      >
        Pagar contas
      </button>

    </div>
  );
}
