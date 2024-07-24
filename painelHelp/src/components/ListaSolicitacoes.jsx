import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { FaCity, FaUser, FaStoreAlt, FaWhatsapp } from "react-icons/fa";
import { SiReasonstudios } from "react-icons/si";
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // Importando o CSS padrão do Carousel
import Dropdown from './Dropdown/Dropdown';

const ListaSolicitacoes = () => {
    const { currentUser } = useAuth();
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [error, setError] = useState(null);
    const [slidesToShow, setSlidesToShow] = useState(1);
    const [statusFilter, setStatusFilter] = useState('Todos');

    const handleResize = useCallback(() => {
        if (window.innerWidth >= 1024) {
            setSlidesToShow(3);
        } else {
            setSlidesToShow(1);
        }
    }, []);

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    useEffect(() => {
        if (!currentUser) {
            setError('Usuário não autenticado');
            return;
        }

        const solicitacoesRef = collection(db, 'solicitacoes');
        let q = query(solicitacoesRef, where('user', '==', currentUser.user));

        if (statusFilter !== 'Todos') {
            q = query(q, where('status', '==', statusFilter));
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const solicitacoesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSolicitacoes(solicitacoesData);
        }, (error) => {
            setError('Erro ao buscar solicitações');
            console.error('Erro ao buscar solicitações:', error);
        });

        return () => unsubscribe();
    }, [currentUser, statusFilter]);

    if (error) {
        return <div className="text-center mt-4 text-lg font-semibold text-red-500">{error}</div>;
    }

    return (
        <div className="flex flex-col w-full lg:h-screen min-w-[370px] bg-primary lg:pt-16 text-white p-4 lg:overflow-y-scroll">
            <div className='mb-4'>
                <div className="flex flex-col justify-center items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold">
                        Minhas Solicitações
                    </h2>
                    <div className="flex-row w-full">
                        <p className='-mb-2'>
                            Filtrar
                        </p>
                        <Dropdown
                            label=""
                            options={['Todos', 'Pendente', 'Progresso', 'Concluído']}
                            selected={statusFilter}
                            onSelectedChange={(option) => setStatusFilter(option)}
                        />
                    </div>
                </div>

                {solicitacoes.length === 0 ? (
                    <div className="text-center text-gray-500">Nenhuma solicitação encontrada</div>
                ) : (
                    <div className="space-y-4 lg:max-w-4xl lg:overflow-hidden">
                        {solicitacoes.map(solicitacao => (
                            <div key={solicitacao.id} className="p-6 lg:block bg-white text-black border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                                <h3 className="text-xl font-semibold mb-2">
                                    {solicitacao.numSolicite}
                                </h3>
                                <div className="flex flex-col gap-4 mb-2">
                                    <div className='flex gap-4'>
                                        <p className="flex items-center">
                                            <FaCity className="mr-2" />
                                            {solicitacao.cidade}
                                        </p>
                                        <p className="flex items-center">
                                            <FaStoreAlt className="mr-2" />
                                            {solicitacao.loja}
                                        </p>
                                    </div>
                                    <div className="flex gap-4 ">
                                        <p className="flex items-center"><FaUser className="mr-2" />
                                            {solicitacao.user}
                                        </p>
                                        <a className='flex items-center bg-green-600 p-2 rounded-2xl shadow-lg' target='_blank' href={`https://wa.me/${solicitacao.whatsapp}`}>
                                            <FaWhatsapp className="text-white text-2xl" />
                                        </a>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 mb-2 p-4">
                                    <div className='flex gap-4'>
                                        <p className="text-gray-700 ">
                                            <strong>Tipo:</strong>
                                            {solicitacao.tipo}
                                        </p>
                                        <p className="text-gray-700 ">
                                            <strong>Item:</strong>
                                            {solicitacao.nomeItem}
                                        </p>
                                    </div>
                                    <p className="flex items-center">
                                        <SiReasonstudios className="mr-2" />
                                        Motivo: {solicitacao.motivo}
                                    </p>
                                    <p className={`text-gray-700 ${solicitacao.status === 'concluido' ? 'text-green-500' : solicitacao.status === 'em progresso' ? 'text-yellow-500' : 'text-red-500'}`}>
                                        <strong>Status:</strong>
                                        {solicitacao.status}
                                    </p>
                                    <p className="text-gray-700">
                                        <strong>Data:</strong>
                                        {new Date(solicitacao.data.toDate()).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListaSolicitacoes;
