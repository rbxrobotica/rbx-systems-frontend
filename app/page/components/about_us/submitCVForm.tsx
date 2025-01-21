import Link from "next/link";
import { SiGmail } from "react-icons/si";

const linkMessage =
  "https://mail.google.com/mail/?view=cm&to=anthony.farias10@outlook.com, outro_email@example.com&su=Envio%20de%20Curr%C3%ADculo&body=Prezado(a)%20Respons%C3%A1vel,%0A%0AEstou%20entrando%20em%20contato%20para%20manifestar%20meu%20interesse%20em%20uma%20vaga%20na%20RBX%20Rob%C3%B3tica.%0A%0A%5BColoque%20aqui%20o%20tipo%20de%20vaga%20que%20você%20tem%20interesse%20e%20suas%20habilidades%2Fexperi%C3%AAncia%20profissional%5D%0A%0AInformações:%0A%0ANome%20Completo%3A%20%5BSeu%20Nome%20Completo%5D%0A%0ATelefone%3A%20%5BSeu%20Telefone%5D%0A%0AOcupação%20Desejada%3A%20%5BOcupação%20Que%20Você%20Busca%5D%0A%0AEm%20anexo%20envio%20meu%20curr%C3%ADculo%20para%20an%C3%A1lise.%20Aguardo%20um%20retorno.%0A%0ACordialmente,%0A%5BSeu%20Nome%5D";

export function SubmitCV() {
  return (
    <div className="flex items-center space-x-4 mt-2">
      <p className="font-semibold text-sm">Envie seu CV: </p>

      <Link
        href={linkMessage}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-2 underline underline-offset-4 text-red-500 hover:text-red-600"
      >
        <SiGmail className="w-5 h-5" />
        <p>Enviar Currículo para RBX Robótica</p>
      </Link>
    </div>
  );
}
