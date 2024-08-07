import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaCity, FaUser, FaStoreAlt, FaWhatsapp } from "react-icons/fa";
import { SiReasonstudios } from "react-icons/si";
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Carousel } from 'react-responsive-carousel';
import Dropdown from '../components/Dropdown/Dropdown';
import Modal from 'react-modal';

Modal.setAppElement('#root'); // Defina o elemento principal da aplicação para acessibilidade

const ListaSolicitacoes = () => {
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [error, setError] = useState(null);
    const [slidesToShow, setSlidesToShow] = useState(1);
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [showModal, setShowModal] = useState(false);
    const [modalText, setModalText] = useState('');
    const [currentSolicitacaoId, setCurrentSolicitacaoId] = useState(null);

    const handleResize = useCallback(() => {
        if (window.innerWidth >= 1024) {
            setSlidesToShow(4);
        } else if (window.innerWidth >= 768) {
            setSlidesToShow(2);
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
        const solicitacoesRef = collection(db, 'solicitacoes');
        let q = query(solicitacoesRef);

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
    }, [statusFilter]);

    const updateStatus = async (id, newStatus) => {
        try {
            const solicitacaoDoc = doc(db, 'solicitacoes', id);
            const solicitacaoData = (await getDoc(solicitacaoDoc)).data();

            if (solicitacaoData.dateReceived) {
                newStatus = 'Concluído';
            }

            await updateDoc(solicitacaoDoc, { status: newStatus });

            setSolicitacoes((prevSolicitacoes) =>
                prevSolicitacoes.map((solicitacao) =>
                    solicitacao.id === id ? { ...solicitacao, status: newStatus } : solicitacao
                )
            );
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    const openModal = (id) => {
        setCurrentSolicitacaoId(id);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!modalText) {
            alert("O campo 'Quem está levando?' é obrigatório.");
            return;
        }

        if (currentSolicitacaoId) {
            try {
                const solicitacaoDoc = doc(db, 'solicitacoes', currentSolicitacaoId);
                await updateDoc(solicitacaoDoc, {
                    status: 'Enviado',
                    send: modalText,
                    dateSend: new Date()
                });
                setShowModal(false);
                setModalText('');

                setSolicitacoes((prevSolicitacoes) =>
                    prevSolicitacoes.map((solicitacao) =>
                        solicitacao.id === currentSolicitacaoId
                            ? { ...solicitacao, status: 'Enviado', send: modalText, dateSend: new Date() }
                            : solicitacao
                    )
                );

            } catch (error) {
                console.error('Erro ao salvar o texto:', error);
            }
        }
    };

    if (error) {
        return <div className="text-center mt-4 text-lg font-semibold text-red-500">{error}</div>;
    }

    return (
        <div className="flex flex-col w-full lg:h-screen min-w-[370px] bg-primary lg:pt-16 text-white p-4 lg:overflow-y-scroll">
            <div className='mb-4'>
                <div className="flex flex-col justify-center items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold">Todas as Solicitações</h2>
                    <div className="flex-row w-full">
                        <p className='-mb-2'>Filtrar</p>
                        <Dropdown
                            label=""
                            options={['Todos', 'Pendente', 'Progresso', 'Enviado', 'Concluído']}
                            selected={statusFilter}
                            onSelectedChange={(option) => setStatusFilter(option)}
                        />
                    </div>
                </div>

                {solicitacoes.length === 0 ? (
                    <div className="text-center text-gray-500">Nenhuma solicitação encontrada</div>
                ) : (
                    <Carousel
                        showThumbs={false}
                        showStatus={false}
                        showArrows={true}
                        centerMode={true}
                        centerSlidePercentage={100 / slidesToShow}
                        className=''
                    >
                        {solicitacoes.map((solicitacao) => (
                            <div key={solicitacao.id} className="max-w-[350px] px-1 py-6 mr-2 bg-white text-black border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                                <h3 className="text-xl font-semibold mb-2">{solicitacao.numSolicite}</h3>
                                <div className="flex flex-col gap-4 mb-2">
                                    <div className='flex gap-4'>
                                        <p className="flex items-center"><FaCity className="mr-2" />{solicitacao.cidade}</p>
                                        <p className="flex items-center"><FaStoreAlt className="mr-2" />{solicitacao.loja}</p>
                                    </div>
                                    <div className="flex gap-4 ">
                                        <p className="flex items-center"><FaUser className="mr-2" />{solicitacao.user}</p>
                                        <a className='flex items-center bg-green-600 p-2 rounded-2xl shadow-lg' target='_blank' href={`https://wa.me/${solicitacao.whatsapp}`}>
                                            <FaWhatsapp className="text-white text-2xl" />
                                        </a>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 mb-2 p-4">
                                    <div className='flex gap-4'>
                                        <p className="text-gray-700 "><strong>Tipo: </strong>{solicitacao.tipo}</p>
                                        <p className="text-gray-700 "><strong>Item: </strong>{solicitacao.nomeItem}</p>
                                    </div>
                                    <p className="flex items-center"><SiReasonstudios className="mr-2" />Motivo: {solicitacao.motivo}</p>
                                    <p className={`text-gray-700 ${solicitacao.status === 'Concluído' ? 'text-green-500' : solicitacao.status === 'Progresso' ? 'text-yellow-500' : 'text-red-500'}`}>
                                        <strong>Status: </strong>{solicitacao.status}
                                    </p>
                                    <p className="text-gray-700">
                                        <strong>Data: </strong>
                                        {new Date(solicitacao.data.toDate()).toLocaleDateString()}
                                    </p>
                                    {solicitacao.dateSend && (
                                        <p className="text-gray-700">
                                            <strong>Enviado: </strong>
                                            {new Date(solicitacao.dateSend.toDate()).toLocaleDateString()}
                                        </p>
                                    )}
                                    {solicitacao.send && (
                                    <p className="text-gray-700">
                                        <strong>Envio: </strong>
                                        {solicitacao.send}
                                    </p>
                                     )}
                                    <div className="flex flex-col gap-2 mt-4">
                                        <div className='flex flex-row gap-2'>
                                            <div className='w-full'>
                                                <button
                                                    className={`w-full mr-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded ${solicitacao.status === 'Pendente' ? 'ring-2' : ''} ${solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído' ? 'cursor-not-allowed hover:bg-gray-400 !bg-gray-400' : ''}`}
                                                    onClick={() => updateStatus(solicitacao.id, 'Pendente')}
                                                    disabled={solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído'}
                                                >
                                                    Pendente
                                                </button>
                                            </div>
                                            <div className='w-full'>
                                                <button
                                                    className={`w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded ${solicitacao.status === 'Progresso' ? 'ring-2' : ''} ${solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído' ? '!bg-gray-400 cursor-not-allowed' : ''}`}
                                                    onClick={() => updateStatus(solicitacao.id, 'Progresso')}
                                                    disabled={solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído'}
                                                >
                                                    Progresso
                                                </button>
                                            </div>
                                        </div>
                                        <div className='flex flex-row gap-2'>
                                            <div className='w-full'>
                                                <button
                                                    className={`w-full mr-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded ${solicitacao.status === 'Enviado' ? 'ring-2 cursor-not-allowed' : ''} ${solicitacao.status === 'Concluído' ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400' : ''}`}
                                                    onClick={() => openModal(solicitacao.id)}
                                                    disabled={solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído'}
                                                >
                                                    Enviado
                                                </button>
                                            </div>
                                            <div className='w-full'>
                                                <button
                                                    className={`w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded ${solicitacao.status === 'Concluído' ? 'ring-2 bg-gray-400 cursor-not-allowed' : ''}`}
                                                    onClick={() => updateStatus(solicitacao.id, 'Concluído')}
                                                    disabled={solicitacao.status === 'Concluído'}
                                                >
                                                    Concluído
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Carousel>
                )}
            </div>
            <Modal
                isOpen={showModal}
                onRequestClose={() => setShowModal(false)}
                contentLabel="Quem está levando?"
                className="fixed inset-0 flex items-center justify-center"
                overlayClassName="fixed inset-0 bg-gray-600 bg-opacity-50"
            >
                <div className="bg-white p-4 rounded-lg w-1/3">
                    <h2 className="text-xl font-bold mb-4">Quem está levando?</h2>
                    <textarea
                        className="w-full h-32 p-2 border rounded-lg mb-4"
                        value={modalText}
                        onChange={(e) => setModalText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button className="bg-gray-500 text-white py-2 px-4 rounded" onClick={() => setShowModal(false)}>Cancelar</button>
                        <button className="bg-blue-500 text-white py-2 px-4 rounded" onClick={handleSave}>Salvar</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ListaSolicitacoes;
