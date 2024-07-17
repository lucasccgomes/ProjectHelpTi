import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { FaCity, FaUser, FaStoreAlt, FaWhatsapp } from "react-icons/fa";
import { SiReasonstudios } from "react-icons/si";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // Importando o CSS padrão do Carousel

const ListaSolicitacoes = () => {
    const { currentUser } = useAuth();
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('todos');
    const [slidesToShow, setSlidesToShow] = useState(1);
    const [showArrows, setShowArrows] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSlidesToShow(3);
            } else {
                setSlidesToShow(1);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchSolicitacoes = async () => {
            setLoading(true);
            setError(null);

            try {
                const solicitacoesRef = collection(db, 'solicitacoes');
                let q = query(solicitacoesRef, where('user', '==', currentUser));

                if (statusFilter !== 'todos') {
                    q = query(q, where('status', '==', statusFilter));
                }

                const querySnapshot = await getDocs(q);
                const solicitacoesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSolicitacoes(solicitacoesData);
            } catch (error) {
                setError('Erro ao buscar solicitações');
                console.error('Erro ao buscar solicitações:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSolicitacoes();
    }, [currentUser, statusFilter]);

    if (loading) {
        return <div className="text-center mt-4 text-lg font-semibold text-blue-500">Carregando solicitações...</div>;
    }

    if (error) {
        return <div className="text-center mt-4 text-lg font-semibold text-red-500">{error}</div>;
    }

    return (
        <div className="flex flex-col w-full lg:h-screen lg:bg-primary lg:pt-16 text-white p-4 lg:overflow-y-scroll">
            <div className='hidden lg:block'>
                <div className="flex flex-col justify-center items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold">Minhas Solicitações</h2>
                    <div className="flex flex-row gap-2 w-full lg:w-auto">
                        <select
                            className="border p-2 rounded text-black"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="todos">Todos os Status</option>
                            <option value="pendente">Pendente</option>
                            <option value="em progresso">Em Progresso</option>
                            <option value="concluido">Concluído</option>
                        </select>
                    </div>
                </div>

                {solicitacoes.length === 0 ? (
                    <div className="text-center text-gray-500">Nenhuma solicitação encontrada</div>
                ) : (
                    <div className="space-y-4 w-full lg:max-w-4xl">
                        {solicitacoes.map(solicitacao => (
                            <div key={solicitacao.id} className="p-6 bg-white text-black border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                                <h3 className="text-xl font-semibold mb-2">{solicitacao.numSolicite}</h3>
                                <div className="flex flex-col gap-4 mb-2">
                                    <div className='flex gap-4'>
                                        <p className="flex items-center"><FaCity className="mr-2" />{solicitacao.cidade}</p>
                                        <p className="flex items-center"><FaStoreAlt className="mr-2" />{solicitacao.loja}</p>
                                    </div>
                                    <div className="flex gap-4 ">
                                        <p className="flex items-center"><FaUser className="mr-2" /> {solicitacao.user}</p>
                                        <a className='flex items-center bg-green-600 p-2 rounded-2xl shadow-lg' target='_blank' href={`https://wa.me/${solicitacao.whatsapp}`}>
                                            <FaWhatsapp className="text-white text-2xl" />
                                        </a>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 mb-2 p-4">
                                    <div className='flex gap-4'>
                                        <p className="text-gray-700 "><strong>Tipo:</strong> {solicitacao.tipo}</p>
                                        <p className="text-gray-700 "><strong>Item:</strong> {solicitacao.nomeItem}</p>
                                    </div>
                                    <p className="flex items-center"><SiReasonstudios className="mr-2" />Motivo: {solicitacao.motivo}</p>
                                    <p className={`text-gray-700 ${solicitacao.status === 'concluido' ? 'text-green-500' : solicitacao.status === 'em progresso' ? 'text-yellow-500' : 'text-red-500'}`}><strong>Status:</strong> {solicitacao.status}</p>
                                    <p className="text-gray-700"><strong>Data:</strong> {new Date(solicitacao.data.toDate()).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="block lg:hidden">
                <div className="flex flex-col justify-center items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-black lg:text-white">
                        Minhas Solicitações
                    </h2>
                    <div className="flex justify-center flex-row gap-2 w-full lg:w-auto">
                        <select
                            className="border p-2 rounded text-black"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="todos">Todos os Status</option>
                            <option value="pendente">Pendente</option>
                            <option value="em progresso">Em Progresso</option>
                            <option value="concluido">Concluído</option>
                        </select>
                    </div>
                </div>

                <div
                    className=""
                    onMouseEnter={() => setShowArrows(true)}
                    onMouseLeave={() => setShowArrows(false)}
                >
                    <Carousel
                        showArrows={showArrows}
                        showStatus={false}
                        showIndicators={false}
                        showThumbs={false}
                        useKeyboardArrows
                        swipeable
                        centerMode={slidesToShow === 1 ? false : true}
                        centerSlidePercentage={slidesToShow === 1 ? 100 : 33.33}
                        infiniteLoop
                    >
                        {solicitacoes.length === 0 ? (
                            <div className="text-center text-gray-500">Nenhuma solicitação encontrada</div>
                        ) : (
                            solicitacoes.map(solicitacao => (
                                <div key={solicitacao.id} className="p-6 bg-slate-100 text-black border border-gray-400 rounded-xl shadow-md transition-shadow duration-200">
                                    <h3 className="text-xl font-semibold mb-2">{solicitacao.numSolicite}</h3>
                                    <div className="flex flex-col gap-4 mb-2">
                                        <div className='flex gap-4'>
                                            <p className="flex items-center"><FaCity className="mr-2" />{solicitacao.cidade}</p>
                                            <p className="flex items-center"><FaStoreAlt className="mr-2" />{solicitacao.loja}</p>
                                        </div>
                                        <div className="flex gap-4 ">
                                            <p className="flex items-center"><FaUser className="mr-2" /> {solicitacao.user}</p>
                                            <a className='flex items-center bg-green-600 p-2 rounded-2xl shadow-lg' target='_blank' href={`https://wa.me/${solicitacao.whatsapp}`}>
                                                <FaWhatsapp className="text-white text-2xl" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 mb-2 p-4">
                                        <div className='flex gap-4'>
                                            <p className=" "><strong>Tipo:</strong> {solicitacao.tipo}</p>
                                            <p className=" "><strong>Item:</strong> {solicitacao.nomeItem}</p>
                                        </div>
                                        <p className="flex items-center">Motivo: {solicitacao.motivo}</p>
                                        <p className={` ${solicitacao.status === 'concluido' ? 'text-green-500' : solicitacao.status === 'em progresso' ? 'text-yellow-500' : 'text-red-500'}`}><strong>Status:</strong> {solicitacao.status}</p>
                                        <p className=""><strong>Data:</strong> {new Date(solicitacao.data.toDate()).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </Carousel>
                </div>
            </div>
        </div>
    );
};

export default ListaSolicitacoes;
