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
  const { currentUser } = useAuth();
  const [lastTicket, setLastTicket] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchLastUserTicket = () => {
        if (!currentUser || !currentUser.user) {
            console.log("No current user found.");
            setLoading(false);
            return;
        }

        console.log("Fetching last ticket for user:", currentUser.user);

        const ticketsRef = collection(db, 'chamados', 'aberto', 'tickets');
        let q;

        if (currentUser.cargo === 'Supervisor') {
            // Se o usuário for Supervisor, busca o último ticket de qualquer usuário
            q = query(
                ticketsRef,
                limit(1)  // Obtém apenas o último ticket
            );
        } else {
            // Caso contrário, busca apenas o último ticket do usuário logado
            q = query(
                ticketsRef,
                where('user', '==', currentUser.user),
                limit(1)  // Obtém apenas o último ticket
            );
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log("Query snapshot size:", querySnapshot.size);
            const lastTicketData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                console.log("Fetched ticket data:", data);
                return {
                    id: doc.id,
                    ...data,
                    data: data.data.toDate()
                };
            });

            setLastTicket(lastTicketData[0]);
            setLoading(false);
            console.log("Set last ticket:", lastTicketData[0]);
        }, (error) => {
            console.error('Erro ao buscar o último chamado:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    };

    fetchLastUserTicket();
}, [currentUser]);

  if (loading) {
    return <div><LoadingSpinner/></div>;
}

  if (!lastTicket) {
    console.log("No last ticket found.");
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
