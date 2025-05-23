import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { FaCity, FaUser, FaStoreAlt } from "react-icons/fa";
import { IoCalendarNumber } from "react-icons/io5";
import { MdReportProblem, MdGridView } from "react-icons/md";
import { Link } from 'react-router-dom';
import { TbNotesOff } from "react-icons/tb";
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

const LastUserTicket = () => {
  // Obtém o usuário autenticado atual do contexto de autenticação
  const { currentUser } = useAuth();
  
  // Define o estado para armazenar o último ticket e o estado de carregamento
  const [lastTicket, setLastTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função que retorna a classe CSS correspondente ao status do ticket
  const getStatusClass = (status) => {
    switch (status) {
      case 'Aberto':
        return 'bg-red-600';
      case 'Andamento':
        return 'bg-orange-600';
      case 'Finalizado':
        return 'bg-green-600';
      case 'VSM':
        return 'bg-blue-700';
      default:
        return 'bg-gray-700';
    }
  };

  // useEffect que busca o último ticket quando o componente é montado
  useEffect(() => {
    const fetchLastUserTicket = () => {
        if (!currentUser || !currentUser.user) {
            // Se não houver usuário autenticado, encerra o carregamento
            setLoading(false);
            return;
        }

        // Referência para a coleção de tickets abertos no Firestore
        const ticketsRef = collection(db, 'chamados', 'aberto', 'tickets');
        let q;

        // Se o usuário for Supervisor, busca o último ticket de qualquer usuário
        if (currentUser.cargo === 'Supervisor') {
            q = query(
                ticketsRef,
                limit(1)  // Limita para obter apenas o último ticket
            );
        } else {
            // Caso contrário, busca apenas o último ticket do usuário logado
            q = query(
                ticketsRef,
                where('user', '==', currentUser.user),
                limit(1)  // Limita para obter apenas o último ticket
            );
        }

        // Inscreve-se para receber atualizações em tempo real dos tickets
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          //  console.log("Query snapshot size:", querySnapshot.size);
            const lastTicketData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    data: data.data.toDate()  // Converte o campo data para um objeto Date
                };
            });

            setLastTicket(lastTicketData[0]);  // Armazena o último ticket no estado
            setLoading(false); // Encerra o carregamento após os dados serem carregados
        }, (error) => {
            // Trata erros que possam ocorrer durante a consulta
            console.error('Erro ao buscar o último chamado:', error);
            setLoading(false);
        });

        // Retorna a função para cancelar a inscrição quando o componente for desmontado
        return () => unsubscribe();
    };

    fetchLastUserTicket();
}, [currentUser]);

  // Exibe um spinner de carregamento enquanto os dados estão sendo carregados
  if (loading) {
    return <div><LoadingSpinner/></div>;
  }

  // Se não houver nenhum ticket, exibe uma mensagem informando o usuário
  if (!lastTicket) {
 //   console.log("No last ticket found.");
    return (
      <div className="w-full min-w-[266px] min-h-[204px] flex bg-white max-w-[320px] px-2 rounded-xl flex-col justify-center items-center text-gray-700">
        <div className='w-full font-bold flex justify-start'>
          <h1 className='px-2 pb-2 lg:-ml-2 lg:pt-0 lg:-mt-1 -mt-6 -ml-2 pl-4 pt-4 bg-altBlue rounded-br-xl text-white mb-3 shadow-md'>
            Ultimo chamado TI
          </h1>
        </div>
        <div className='gap-4 text-sm h-[155px] flex flex-col justify-center items-center'>
          <p><TbNotesOff className='text-2xl'/></p>
          <p>Você não tem nenhum chamado.</p>
        </div>
      </div>
    );
  }

  // Função para abreviar o nome da cidade, exceto a última palavra
  const abreviarCidade = (nomeCidade) => {
    const partes = nomeCidade.split(' ');
    if (partes.length === 1) return nomeCidade; // Se o nome tem apenas uma palavra, não abrevia
  
    return partes.map((parte, index) => {
      if (index === partes.length - 1) {
        return parte; // A última palavra não é abreviada
      }
      return parte.charAt(0) + '.'; // Abrevia as palavras anteriores
    }).join(' ');
  };

  return (
    <div className="w-full min-w-[266px] min-h-[204px] flex bg-white max-w-[320px] px-2 rounded-xl flex-col justify-center items-center text-gray-700">
      <div className='w-full font-bold flex justify-start'>
        <h1 className='px-2 pb-2 lg:-ml-2 lg:pt-0 lg:-mt-1 -mt-6 -ml-2 pl-4 pt-4 bg-altBlue rounded-br-xl text-white mb-3 shadow-md'>
          Ultimo chamado TI
        </h1>
      </div>
      <div key={lastTicket.id} className='gap-4 text-sm'>
        <div className="shadow-md bg-primaryBlueDark text-white lg:min-w-[250px] mb-4 p-4 pb-0 border-2 rounded-xl">
          <div className="text-xl text-gray-700 bg-white font-bold uppercase rounded-b-xl -mt-5 mb-2 pb-1 text-center">
            {lastTicket.order}
          </div>
          <p className={`my-1 p-1 rounded-lg text-center text-white uppercase shadow-xl ${getStatusClass(lastTicket.status)}`}>
            {lastTicket.status}
          </p>

          <div className='flex gap-4 mb-1'>
          <p className='flex uppercase items-center'><FaCity />: {abreviarCidade(lastTicket.cidade)}</p>
            <p className='flex uppercase items-center'><FaUser />: {lastTicket.user}</p>
          </div>

          <div className='flex gap-4 mb-1'>
            <p className='hidden uppercase items-center'>
              <FaStoreAlt />: {lastTicket.loja}
            </p>
            <p className='hidden uppercase items-center'>
              <MdReportProblem />: {lastTicket.localProblema}
            </p>
          </div>

          <div className='flex gap-4 mb-1'>
            <p className='justify-center hidden lg:flex items-center'>
              <IoCalendarNumber />: {lastTicket.data.toLocaleString()}
            </p>
          </div>
          <div className='flex justify-end -mr-5'>
            <Link
              to="/usertickets"
              className="flex justify-center items-center gap-1 bg-white text-gray-700 pt-1 px-1 rounded-tl-lg"
            >
              <div className='flex justify-center items-center gap-1 hover:scale-[0.8]'>
                <MdGridView className='' />
                <p className='mr-1' >Ver Todos</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LastUserTicket;
