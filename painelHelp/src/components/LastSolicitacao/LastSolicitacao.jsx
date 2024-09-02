import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { FaCity, FaUser } from "react-icons/fa";
import { MdGridView } from "react-icons/md";
import { IoCalendarNumber } from "react-icons/io5";
import { Link } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import { TbNotesOff } from "react-icons/tb";

// Componente para exibir a última solicitação de TI
const LastSolicitacao = () => {
    const { currentUser } = useAuth(); // Obtenção do usuário autenticado
    const [lastSolicitacao, setLastSolicitacao] = useState(null); // Estado para armazenar a última solicitação
    const [loading, setLoading] = useState(true); // Estado para indicar se os dados estão carregando

    // useEffect para buscar a última solicitação ao carregar o componente
    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const solicitacoesRef = collection(db, 'solicitacoes'); // Referência à coleção de solicitações no Firestore
        let q;

        // Define a query com base no cargo do usuário
        if (currentUser.cargo === 'Supervisor') {
            // Se o usuário for Supervisor, busca a última solicitação de qualquer usuário
            q = query(
                solicitacoesRef,
                limit(1)  // Obtém apenas a última solicitação
            );
        } else {
            // Caso contrário, busca apenas a última solicitação do usuário logado
            q = query(
                solicitacoesRef,
                where('user', '==', currentUser.user),
                limit(1)  // Obtém apenas a última solicitação
            );
        }

        // Configura um listener para a query
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const solicitacoesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLastSolicitacao(solicitacoesData[0]); // Armazena a última solicitação
            setLoading(false); // Indica que o carregamento foi concluído
        }, (error) => {
            console.error('Erro ao buscar a última solicitação:', error);
            setLoading(false);
        });

        return () => unsubscribe(); // Limpa o listener quando o componente é desmontado
    }, [currentUser]);

    // Função para obter a classe CSS com base no status da solicitação
    const getStatusClass = (status) => {
        switch (status) {
            case 'Pendente':
                return 'bg-red-600';
            case 'Progresso':
                return 'bg-orange-600';
            case 'Concluído':
                return 'bg-green-600';
            default:
                return 'bg-gray-700';
        }
    };

    if (loading) {
        return <div><LoadingSpinner /></div>; // Exibe o spinner de carregamento enquanto os dados são buscados
    }

    // Função para abreviar o nome da cidade
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

    // Se não houver nenhuma solicitação
    if (!lastSolicitacao) {
        return (
            <div className="w-full min-w-[266px] min-h-[204px] flex bg-white max-w-[320px] px-2 rounded-xl flex-col justify-center items-center text-gray-700">
                <div className='w-full font-bold flex justify-start'>
                    <h1 className='px-2 pb-2 lg:-ml-2 lg:pt-0 lg:-mt-1 -mt-6 -ml-2 pl-4 pt-4 bg-altBlue rounded-br-xl text-white mb-3 shadow-md'>
                        Ultima solicitação TI
                    </h1>
                </div>
                <div className='gap-4 text-sm h-[155px] flex flex-col justify-center items-center'>
                    <p><TbNotesOff className='text-2xl' /></p>
                    <p>Você não tem nenhuma solicitação.</p>
                </div>
            </div>
        );
    }

    // Exibe a última solicitação encontrada
    return (
        <div className="w-full min-w-[266px] min-h-[204px] flex bg-white max-w-[320px] px-2 rounded-xl flex-col justify-center items-center text-gray-700">
            <div className='w-full font-bold flex justify-start'>
                <h1 className='px-2 pb-2 lg:-ml-2 lg:pt-0 lg:-mt-1 -mt-6 -ml-2 pl-4 pt-4 bg-altBlue rounded-br-xl text-white mb-3 shadow-md'>
                    Ultima solicitação TI
                </h1>
            </div>
            <div key={lastSolicitacao.id} className='gap-4 text-sm'>
                <div className="shadow-md bg-primaryBlueDark text-white lg:min-w-[250px] mb-4 p-4 pb-0 border-2 rounded-xl">
                    <div className="text-xl text-gray-700 bg-white font-bold uppercase rounded-b-xl -mt-5 mb-2 pb-1 text-center">
                        {lastSolicitacao.numSolicite}
                    </div>
                    <p className={`my-1 p-1 rounded-lg text-center text-white uppercase shadow-xl ${getStatusClass(lastSolicitacao.status)}`}>
                        {lastSolicitacao.status}
                    </p>

                    <div className='flex gap-4 mb-1'>
                        <p className='flex uppercase items-center'><FaCity />: {abreviarCidade(lastSolicitacao.cidade)}</p>
                        <p className='flex uppercase items-center'><FaUser />: {lastSolicitacao.user}</p>
                    </div>

                    <div className='flex gap-4 mb-1'>
                        <p className='justify-center hidden lg:flex items-center'>
                            <IoCalendarNumber />: {new Date(lastSolicitacao.data.toDate()).toLocaleDateString()}
                        </p>
                    </div>
                    <div className='flex justify-end -mr-5'>
                        <Link
                            to="/solicitacao"
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

export default LastSolicitacao;
