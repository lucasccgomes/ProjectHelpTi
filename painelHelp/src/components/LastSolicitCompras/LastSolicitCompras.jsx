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

const LastSolicitCompras = () => {
    // Obtém o usuário atual autenticado
    const { currentUser } = useAuth();

    // Define o estado para armazenar a última solicitação e o estado de carregamento
    const [lastSolicitacao, setLastSolicitacao] = useState(null);
    const [loading, setLoading] = useState(true);

    // useEffect para buscar a última solicitação quando o componente for montado
    useEffect(() => {
        if (!currentUser) {
            // Se não houver usuário atual, encerra o carregamento
            setLoading(false);
            return;
        }

        // Referência para a coleção 'solicitCompras' no Firestore
        const solicitacoesRef = collection(db, 'solicitCompras');
        let q;

        // Se o usuário for um Supervisor, busca a última solicitação de qualquer usuário
        if (currentUser.cargo === 'Supervisor') {
            q = query(
                solicitacoesRef,
                limit(1)  // Limita para obter apenas a última solicitação
            );
        } else {
            // Caso contrário, busca a última solicitação do próprio usuário logado
            q = query(
                solicitacoesRef,
                where('user', '==', currentUser.user),
                limit(1)  // Limita para obter apenas a última solicitação
            );
        }

        // Inscreve-se para receber atualizações em tempo real das solicitações
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            // Mapeia os dados das solicitações e armazena a primeira (mais recente)
            const solicitacoesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLastSolicitacao(solicitacoesData[0]);
            setLoading(false); // Encerra o carregamento após os dados serem carregados
        }, (error) => {
            // Trata erros que possam ocorrer durante a consulta
            console.error('Erro ao buscar a última solicitação:', error);
            setLoading(false);
        });

        // Retorna a função para cancelar a inscrição quando o componente for desmontado
        return () => unsubscribe();
    }, [currentUser]);

    // Função para retornar a classe CSS com base no status da solicitação
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

    // Mostra o spinner de carregamento enquanto os dados estão sendo carregados
    if (loading) {
        return <div><LoadingSpinner /></div>;
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

    // Se não houver nenhuma solicitação, exibe uma mensagem informando o usuário
    if (!lastSolicitacao) {
        return (
            <div className="w-full min-w-[266px] min-h-[204px] flex bg-white max-w-[320px] px-2 rounded-xl flex-col justify-center items-center text-gray-700">
                <div className='w-full font-bold flex justify-start'>
                    <h1 className='px-2 pb-2 lg:-ml-2 lg:pt-0 lg:-mt-1 -mt-6 -ml-2 pl-4 pt-4 bg-altBlue rounded-br-xl text-white mb-3 shadow-md'>
                        Ultima solicitação CP
                    </h1>
                </div>
                <div className='gap-4 text-sm h-[155px] flex flex-col justify-center items-center'>
                    <p><TbNotesOff className='text-2xl' /></p>
                    <p>Você não tem nenhuma solicitação.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-w-[266px] min-h-[204px] flex bg-white max-w-[320px] px-2 rounded-xl flex-col justify-center items-center text-gray-700">
            <div className='w-full font-bold flex justify-start'>
                <h1 className='px-2 pb-2 lg:-ml-2 lg:pt-0 lg:-mt-1 -mt-6 -ml-2 pl-4 pt-4 bg-altBlue rounded-br-xl text-white mb-3 shadow-md'>
                    Ultima solicitação CP
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
                            to="/solicitacompras"
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

export default LastSolicitCompras;
