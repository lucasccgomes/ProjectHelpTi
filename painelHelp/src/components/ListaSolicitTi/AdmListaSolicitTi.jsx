import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { FaCity, FaUser, FaStoreAlt, FaShuttleVan, FaCheckCircle } from "react-icons/fa";
import { RiUserReceived2Fill } from "react-icons/ri";
import { SiReasonstudios } from "react-icons/si";
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import Dropdown from '../Dropdown/Dropdown';
import { MdOutlineAddShoppingCart } from "react-icons/md";
import { GrNewWindow, GrStatusUnknown, GrInProgress } from "react-icons/gr";
import { ImCancelCircle } from "react-icons/im";
import { TbReplaceFilled } from "react-icons/tb";
import Modal from '../Modal/Modal';
import { IoCalendarNumber } from "react-icons/io5";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { HiPencilSquare } from "react-icons/hi2";
import AlertModal from '../AlertModal/AlertModal';

const AdmListaSolicitTi = () => {
    const [isEditAlertModalOpen, setIsEditAlertModalOpen] = useState(false); // Estado para controlar a exibição do modal de alerta de edição
    const { currentUser } = useAuth(); // Obtém o usuário atual autenticado
        const [solicitacoes, setSolicitacoes] = useState([]);  // Estado para armazenar a lista de solicitações   
    const [error, setError] = useState(null); // Estado para armazenar possíveis erros
    const [slidesToShow, setSlidesToShow] = useState(1);// Estado para controlar quantos slides devem ser mostrados
    const [statusFilter, setStatusFilter] = useState('Todos'); // Estado para controlar o filtro de status das solicitações
    const [isModalOpen, setIsModalOpen] = useState(false);  // Estado para controlar a exibição do modal   
    const [selectedSolicitacao, setSelectedSolicitacao] = useState(null); // Estado para armazenar a solicitação selecionada
    const [buttonDisabled, setButtonDisabled] = useState(false);// Estado para desabilitar o botão de confirmação
    const [cities, setCities] = useState([]);// Estado para armazenar as cidades disponíveis para filtro   
    const [storeFilter, setStoreFilter] = useState('Todos'); // Estado para controlar o filtro de lojas   
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false); // Estado para controlar a exibição do modal de cancelamento
    const [cancelReason, setCancelReason] = useState(''); // Estado para armazenar o motivo do cancelamento
    const [isSendModalOpen, setIsSendModalOpen] = useState(false); // Estado para controlar a exibição do modal de envio
    const [heTook, setHeTook] = useState(''); // Estado para armazenar quem recebeu a solicitação
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false); // Estado para controlar a exibição do modal de conclusão
    const [selectedDate, setSelectedDate] = useState(null); // Estado para armazenar a data selecionada
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);// Estado para controlar a exibição do modal de edição
    const [editedItems, setEditedItems] = useState({});// Estado para armazenar os itens editados
    const [editReason, setEditReason] = useState('');// Estado para armazenar o motivo da edição
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);// Estado para controlar a exibição do modal de alerta
    const [sendAlertModalOpen, setSendAlertModalOpen] = useState(false);// Estado para controlar a exibição do modal de alerta de envio
    const [userFilter, setUserFilter] = useState('Todos'); // Estado para controlar o filtro de usuários
    const [userFilterOptions, setUserFilterOptions] = useState(['Todos']);// Estado para armazenar as opções de filtro de usuários
    const [filteredSolicitacoes, setFilteredSolicitacoes] = useState([]);// Estado para armazenar as solicitações filtradas
    const [storeFilterOptions, setStoreFilterOptions] = useState(['Todos']);// Estado para armazenar as opções de filtro de lojas

    // Função para abrir o modal de edição e inicializar os itens selecionados
    const openEditModal = (solicitacao) => {
        setSelectedSolicitacao(solicitacao);
        setEditedItems(solicitacao.item); // Inicializa com os itens atuais
        setIsEditModalOpen(true);
    };

    // Função para salvar as alterações feitas na solicitação
    const handleSaveEdit = async () => {
        if (!editReason.trim()) {
            setIsEditAlertModalOpen(true); // Abre o AlertModal
            return;
        }

        try {
            // Calcula o novo preço total baseado nos itens editados
            const newTotalPrice = Object.entries(editedItems).reduce((total, [itemNome, quantidade]) => {
                const itemPrice = selectedSolicitacao.itemPrice[itemNome];
                return total + (itemPrice * quantidade);
            }, 0);

            // Atualiza a solicitação no Firestore
            const solicitacaoRef = doc(db, 'solicitTi', selectedSolicitacao.id);
            await updateDoc(solicitacaoRef, {
                originalOrder: selectedSolicitacao.item,
                item: editedItems,
                reasonChange: editReason,
                totalPrice: newTotalPrice.toFixed(2)
            });

            setIsEditModalOpen(false);
            setEditReason('');
        } catch (error) {
            console.error('Erro ao salvar alteração:', error);
        }
    };

    // Função para abrir o modal de conclusão de solicitação
    const openCompleteModal = (solicitacao) => {
        setSelectedSolicitacao(solicitacao);
        setIsCompleteModalOpen(true);
    };

    // Função para abrir o modal de envio de solicitação
    const openSendModal = (solicitacao) => {
        setSelectedSolicitacao(solicitacao);
        setIsSendModalOpen(true);
    };

    // Função para abrir o modal de cancelamento de solicitação
    const openCancelModal = (solicitacao) => {
        setSelectedSolicitacao(solicitacao);
        setIsCancelModalOpen(true);
    };

    // Função para abreviar o nome de uma cidade
    const abreviarCidade = (cidade) => {
        const palavras = cidade.split(' ');
        if (palavras.length > 1) {
            const primeiraPalavra = palavras[0].substring(0, 3); // Abrevia a primeira palavra
            const ultimaPalavra = palavras[palavras.length - 1]; // Mantém a última palavra completa
            return `${primeiraPalavra}. ${ultimaPalavra}`;
        }
        return cidade; // Se for uma única palavra, retorna sem abreviação
    };

    // Função para abrir o modal de visualização de solicitação
    const openModal = (solicitacao) => {
        setSelectedSolicitacao(solicitacao);
        setIsModalOpen(true);
    };

    // Função para fechar o modal de visualização de solicitação
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSolicitacao(null);
    };

    // Função para confirmar o recebimento de uma solicitação
    const handleConfirmReceived = async () => {
        if (!selectedSolicitacao) return;

        try {
            const solicitacaoRef = doc(db, 'solicitTi', selectedSolicitacao.id);
            await updateDoc(solicitacaoRef, {
                dateReceived: new Date(),
                status: 'Concluído'  // Atualiza o status para 'concluído'
            });
            setButtonDisabled(true);
            closeModal();
        } catch (error) {
            console.error('Erro ao atualizar solicitação:', error);
        }
    };

    // Função para alterar o status de uma solicitação
    const handleStatusChange = async (id, newStatus) => {
        try {
            const solicitacaoRef = doc(db, 'solicitTi', id);

            // Obtenha os dados da solicitação antes de atualizar o status
            const solicitacaoSnap = await getDoc(solicitacaoRef);
            if (!solicitacaoSnap.exists()) {
                console.error('Solicitação não encontrada.');
                return;
            }
            const solicitacaoData = solicitacaoSnap.data();
            const previousStatus = solicitacaoData.status;

            // Atualiza o status da solicitação
            await updateDoc(solicitacaoRef, {
                status: newStatus
            });

            // Se a mudança for de "Separando" para "Pendente" ou "Cancelado", devolver as quantidades ao estoque
            if ((previousStatus === 'Separando') && (newStatus === 'Pendente' || newStatus === 'Cancelado')) {
                await updateStockQuantities(solicitacaoData.item, 'increase');
            }

            // Se a mudança for para "Separando", subtrair as quantidades do estoque
            if (newStatus === 'Separando') {
                await updateStockQuantities(solicitacaoData.item, 'decrease');
            }

            // Notificação ao usuário
            if (solicitacaoData.user) {
                const usuariosCollectionRef = collection(db, 'usuarios');
                const usuariosSnapshot = await getDocs(usuariosCollectionRef);

                let userData = null;
                let cidadeEncontrada = null;

                usuariosSnapshot.forEach((cidadeDoc) => {
                    const cidadeData = cidadeDoc.data();
                    if (cidadeData[solicitacaoData.user]) {
                        userData = cidadeData[solicitacaoData.user];
                        cidadeEncontrada = cidadeDoc.id;
                    }
                });

                if (userData && userData.token) {
                    const tokens = Array.isArray(userData.token) ? userData.token : [userData.token];
                    const notificationMessage = {
                        title: `Solicitação ${id}`,
                        body: `Status ${newStatus}`,
                        click_action: "https://drogalira.com.br/solicitati",
                        icon: "https://iili.io/duTTt8Q.png"
                    };

                    const response = await fetch('https://8f38-2804-1784-30b3-6700-7285-c2ff-fe34-e4b0.ngrok-free.app/send-notification', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ tokens, notification: notificationMessage })
                    });

                    const result = await response.json();
                    if (response.ok) {
                        console.log('Notificação enviada com sucesso:', result);
                    } else {
                        console.error('Erro ao enviar notificação:', result);
                    }
                } else {
                    console.error(`Token do usuário ${solicitacaoData.user} não encontrado na cidade ${cidadeEncontrada}.`);
                }
            }

        } catch (error) {
            console.error('Erro ao atualizar status da solicitação:', error);
        }
    };

    // Função para atualizar as quantidades do estoque
    const updateStockQuantities = async (items, operation) => {
        try {
            const estoqueRef = doc(db, 'estoqueTi', 'estoque');
            const estoqueSnap = await getDoc(estoqueRef);

            if (estoqueSnap.exists()) {
                const estoqueData = estoqueSnap.data();

                for (const itemNome in items) {
                    const quantidade = items[itemNome];
                    for (const categoria in estoqueData) {
                        if (estoqueData[categoria][itemNome]) {
                            if (operation === 'increase') {
                                estoqueData[categoria][itemNome].trueAmount += quantidade;
                                estoqueData[categoria][itemNome].amount += quantidade;
                            } else if (operation === 'decrease') {
                                estoqueData[categoria][itemNome].trueAmount -= quantidade;
                                estoqueData[categoria][itemNome].amount -= quantidade;
                            }
                        }
                    }
                }

                await updateDoc(estoqueRef, estoqueData);
            } else {
                console.error('Documento de estoque não encontrado.');
            }
        } catch (error) {
            console.error('Erro ao atualizar as quantidades do estoque:', error);
        }
    };

    // Função para ajustar a quantidade de slides mostrados conforme o tamanho da janela
    const handleResize = useCallback(() => {
        if (window.innerWidth >= 1024) {
            setSlidesToShow(3);
        } else {
            setSlidesToShow(1);
        }
    }, []);

    // Efeito para configurar as opções de filtro de lojas com base nas solicitações
    useEffect(() => {
        const uniqueStores = new Set(solicitacoes.map(solicitacao => solicitacao.loja));
        setStoreFilterOptions(['Todos', ...Array.from(uniqueStores)]);
    }, [solicitacoes]);

    // Efeito para filtrar as solicitações com base nos filtros selecionados
    useEffect(() => {
        const filtered = solicitacoes.filter(solicitacao =>
            (userFilter === 'Todos' || solicitacao.user === userFilter) &&
            (statusFilter === 'Todos' || solicitacao.status === statusFilter) &&
            (storeFilter === 'Todos' || solicitacao.loja === storeFilter)
        );
        setFilteredSolicitacoes(filtered);
    }, [userFilter, statusFilter, storeFilter, solicitacoes]);

    // Efeito para ajustar o número de slides a serem mostrados ao redimensionar a janela
    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    // Efeito para buscar e escutar as atualizações em tempo real das solicitações
    useEffect(() => {
        const solicitacoesRef = collection(db, 'solicitTi');
        const unsubscribe = onSnapshot(solicitacoesRef, (querySnapshot) => {
            const solicitacoesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSolicitacoes(solicitacoesData);
        }, (error) => {
            setError('Erro ao buscar solicitações');
            console.error('Erro ao buscar solicitações:', error);
        });

        return () => unsubscribe();
    }, []);

    // Efeito para configurar as opções de filtro de usuários com base nas solicitações
    useEffect(() => {
        const uniqueUsers = new Set(solicitacoes.map(solicitacao => solicitacao.user));
        setUserFilterOptions(['Todos', ...Array.from(uniqueUsers)]);
    }, [solicitacoes]);

    // Se houver um erro, exibe uma mensagem de erro na interface
    if (error) {
        return <div className="text-center mt-4 text-lg font-semibold text-red-500">{error}</div>;
    }


    return (
        <div className="flex flex-col w-full lg:h-screen bg-altBlue lg:pt-16 text-white">
            <div className='mb-4'>
                <div className="flex flex-col justify-center bg-altBlue items-center gap-4 lg:-mt-3 lg:pb-3">
                    <div className='bg-altBlue p-3 rounded-xl w-full fixed lg:mt-40 mt-60'>
                        <div className='bg-primaryBlueDark p-3 rounded-xl shadow-xl w-full '>
                            <h2 className="text-2xl text-center font-bold">
                                T.I Solicitações
                            </h2>
                            <div className={`flex flex-col w-full ${currentUser.cargo === 'Supervisor' ? 'hidden' : ''} gap-4`}>
                                <div className='flex justify-between gap-2 text-xs lg:text-lg'>
                                    <div className='w-full'>
                                        <p className='-mb-2'>Status</p>
                                        <Dropdown
                                            options={['Todos', 'Pendente', 'Progresso', 'Concluído', 'Enviado']}
                                            selected={statusFilter}
                                            onSelectedChange={(option) => setStatusFilter(option)}
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <p className='-mb-2'>Loja</p>
                                        <Dropdown
                                            options={storeFilterOptions}
                                            selected={storeFilter}
                                            onSelectedChange={(option) => setStoreFilter(option)}
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <p className='-mb-2'>Usuario</p>
                                        <Dropdown
                                            options={userFilterOptions}
                                            selected={userFilter}
                                            onSelectedChange={(option) => setUserFilter(option)}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <div className=' w-full bg-altBlue p-4 pt-48 lg:pt-20'>
                    {filteredSolicitacoes.length === 0 ? (
                        <div className="text-center text-white">Nenhuma solicitação encontrada</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:pt-20 bg-altBlue ">
                            {filteredSolicitacoes.map(solicitacao => (
                                <div key={solicitacao.id} className="px-4 pb-4 bg-white text-black border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className='flex justify-between pb-3'>
                                        <h3 className="p-2 rounded-br-xl shadow-xl  -ml-5 -mt-1 text-2xl bg-altBlue text-white font-bold">
                                            {solicitacao.numSolicite}
                                        </h3>
                                        <button
                                            onClick={() => openEditModal(solicitacao)}
                                            disabled={solicitacao.status === 'Cancelado' || solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído'}
                                            className={`text-red-700 ml-2 text-3xl hover:scale-[0.9] ${solicitacao.status === 'Cancelado' || solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído' ? '!text-gray-500 cursor-not-allowed hover:scale-100' : ''}`}
                                            title='Alterar'
                                        >
                                            <HiPencilSquare />
                                        </button>
                                        <p className="text-primaryBlueDark cursor- flex text-3xl items-center">
                                            {solicitacao.tipo === 'Reposição' && <TbReplaceFilled className="ml-2" title='Item Reposição' />}
                                            {solicitacao.tipo === 'Novo' && <GrNewWindow className="ml-2" title='Item Novo' />}
                                        </p>

                                    </div>
                                    <div className="flex flex-col gap-4 mb-2">
                                        <div className='flex gap-4 '>
                                            <div className="flex items-center">
                                                <FaCity className="mr-2 text-primaryBlueDark text-xl" />
                                                <p className='font-semibold text-gray-700'>
                                                    {abreviarCidade(solicitacao.cidade)}
                                                </p>
                                            </div>
                                            <div className="flex items-center">
                                                <FaStoreAlt className="mr-2 text-primaryBlueDark text-xl" />
                                                <p className='font-semibold text-gray-700'>
                                                    {solicitacao.loja}
                                                </p>
                                            </div>
                                            <div className="flex items-center">
                                                <FaUser className="mr-2 text-primaryBlueDark text-xl" />
                                                <p className='font-semibold text-gray-700'>
                                                    {solicitacao.user}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 mb-2 p-4">
                                        {Object.entries(solicitacao.item).map(([itemNome, quantidade]) => (
                                            <div key={itemNome} className='flex justify-between gap-2 shadow-lg bg-primaryBlueDark p-2 rounded-xl text-white'>
                                                <div className='font-semibold flex justify-center items-center'>
                                                    <MdOutlineAddShoppingCart className='text-xl text-white' />
                                                    <p className='ml-2'>
                                                        {itemNome}
                                                    </p>
                                                </div>
                                                <div className='font-semibold flex'>
                                                    <p>
                                                        Qtd:
                                                    </p>
                                                    <p className='font-normal ml-1'>
                                                        {quantidade}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex flex-col items-center w-full break-all">
                                            <div className='flex justify-center items-center'>
                                                <SiReasonstudios className="mr-2 text-primaryBlueDark text-xl" />
                                                <p className='font-semibold text-gray-700'>
                                                    Motivo
                                                </p>
                                            </div>
                                            <p>
                                                {solicitacao.motivo}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center text-gray-700">
                                            <div className="flex justify-center items-center text-gray-700">
                                                <IoCalendarNumber className="mr-2 text-primaryBlueDark text-xl" />
                                                <p className='font-semibold text-gray-700'>
                                                    {new Date(solicitacao.data.toDate()).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {solicitacao.status === 'Enviado' && solicitacao.dateSend && (
                                                <div className="flex justify-start items-center text-gray-700">
                                                    <FaShuttleVan className="mr-2 text-primaryBlueDark text-xl" />
                                                    <p className='font-semibold text-gray-700'>
                                                        {new Date(solicitacao.dateSend.toDate()).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}

                                            {solicitacao.status === 'Concluído' && solicitacao.dateReceived && (
                                                <div className="flex justify-start items-center text-gray-700">
                                                    <RiUserReceived2Fill className="mr-2 text-primaryBlueDark text-xl" />
                                                    <p className='font-semibold text-gray-700'>
                                                        {new Date(solicitacao.dateReceived.toDate()).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                            <div className={`text-gray-700 ${solicitacao.status === 'Concluído' ? 'text-green-500' : solicitacao.status === 'Progresso' ? 'text-yellow-500' : solicitacao.status === 'Cancelado' || solicitacao.status === 'Pendente' ? 'text-red-500' : 'text-primaryBlueDark'}`}>
                                                <p className="text-primaryBlueDark flex text-3xl items-center">
                                                    {solicitacao.status === 'Pendente' && <GrStatusUnknown className="ml-2 text-secRed text-3xl" title='Pendente' />}
                                                    {solicitacao.status === 'Separando' && <GrInProgress className="ml-2 text-orange-600 text-3xl" title='Separando' />}
                                                    {solicitacao.status === 'Cancelado' && <ImCancelCircle className="ml-2 text-secRed text-3xl" title='Cancelado' />}
                                                    {solicitacao.status === 'Enviado' && <FaShuttleVan className="ml-2 text-primaryOpaci text-3xl" title='Enviado' />}
                                                    {solicitacao.status === 'Concluído' && <FaCheckCircle className="ml-2 text-green-700 text-3xl" title='Concluído' />}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='flex justify-between'>
                                        <button
                                            onClick={() => handleStatusChange(solicitacao.id, 'Pendente')}
                                            disabled={solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído' || solicitacao.status === 'Cancelado'} // Desabilitar se status for "Enviado", "Concluído" ou "Cancelado"
                                            className={`ml-2 text-3xl ${solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído' || solicitacao.status === 'Cancelado' ? 'text-gray-400 cursor-not-allowed' : 'text-secRed'}`}
                                            title='Pendente'
                                        >
                                            <GrStatusUnknown />
                                        </button>

                                        <button
                                            onClick={() => openCancelModal(solicitacao)}
                                            disabled={solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído' || solicitacao.status === 'Cancelado'} // Desabilitar se status for "Enviado", "Concluído" ou "Cancelado"
                                            className={`ml-2 text-3xl ${solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído' || solicitacao.status === 'Cancelado' ? 'text-gray-400 cursor-not-allowed' : 'text-secRed'}`}
                                            title='Cancelado'
                                        >
                                            <ImCancelCircle />
                                        </button>

                                        <button
                                            onClick={() => handleStatusChange(solicitacao.id, 'Separando')}
                                            disabled={solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído' || solicitacao.status === 'Cancelado'} // Desabilitar se status for "Enviado", "Concluído" ou "Cancelado"
                                            className={`ml-2 text-3xl ${solicitacao.status === 'Enviado' || solicitacao.status === 'Concluído' || solicitacao.status === 'Cancelado' ? 'text-gray-400 cursor-not-allowed' : 'text-orange-600'}`}
                                            title='Separando'
                                        >
                                            <GrInProgress />
                                        </button>

                                        <button
                                            onClick={() => openSendModal(solicitacao)}
                                            disabled={solicitacao.status === 'Pendente' || solicitacao.status === 'Cancelado' || solicitacao.status === 'Concluído'} // Desabilitar se status for "Pendente", "Cancelado" ou "Concluído"
                                            className={`ml-2 text-3xl ${solicitacao.status === 'Pendente' || solicitacao.status === 'Cancelado' || solicitacao.status === 'Concluído' ? 'text-gray-400 cursor-not-allowed' : 'text-primaryOpaci'}`}
                                            title='Enviado'
                                        >
                                            <FaShuttleVan />
                                        </button>

                                        <button
                                            onClick={() => openCompleteModal(solicitacao)}
                                            disabled={solicitacao.status !== 'Enviado' || solicitacao.status === 'Concluído' || solicitacao.status === 'Cancelado'} // Desabilitar se status não for "Enviado", ou se for "Concluído" ou "Cancelado"
                                            className={`ml-2 text-3xl ${solicitacao.status !== 'Enviado' || solicitacao.status === 'Concluído' || solicitacao.status === 'Cancelado' ? 'text-gray-400 cursor-not-allowed' : 'text-green-700'}`}
                                            title='Concluído'
                                        >
                                            <FaCheckCircle />
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


            <Modal isOpen={isModalOpen} onClose={closeModal}>
                <div className="text-center text-gray-700">
                    <p>Você realmente recebeu?</p>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={handleConfirmReceived}
                            className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                        >
                            Sim
                        </button>
                        <button
                            onClick={closeModal}
                            className="bg-red-500 text-white px-4 py-2 rounded"
                        >
                            Não
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)}>
                <div className="text-center text-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Motivo do Cancelamento</h2>
                    <ReactQuill value={cancelReason} onChange={setCancelReason} />
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={async () => {
                                if (!cancelReason || cancelReason.trim() === '<p><br></p>') {
                                    setIsAlertModalOpen(true); // Abre o modal de alerta
                                    return;
                                }
                                try {
                                    const solicitacaoRef = doc(db, 'solicitTi', selectedSolicitacao.id);
                                    await updateDoc(solicitacaoRef, {
                                        status: 'Cancelado',
                                        canceledReason: cancelReason // Grava o motivo do cancelamento
                                    });
                                    setIsCancelModalOpen(false); // Fecha o modal após salvar
                                    handleStatusChange(selectedSolicitacao.id, 'Cancelado'); // Chama handleStatusChange
                                } catch (error) {
                                    console.error('Erro ao cancelar solicitação:', error);
                                }
                            }}
                            className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                        >
                            Salvar
                        </button>

                        <button
                            onClick={() => setIsCancelModalOpen(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isSendModalOpen}
                onClose={() => {
                    setIsSendModalOpen(false);
                    setHeTook(''); // Limpa o input ao fechar o modal
                }}
            >
                <div className="text-center text-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Quem está levando?</h2>
                    <input
                        type="text"
                        maxLength="20"
                        value={heTook}
                        onChange={(e) => setHeTook(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mb-4"
                        placeholder="Nome (máx. 20 caracteres)"
                    />
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={async () => {
                                if (!heTook.trim()) { // Verifica se o campo está vazio
                                    setSendAlertModalOpen(true); // Abre o modal de alerta
                                    return;
                                }
                                try {
                                    const solicitacaoRef = doc(db, 'solicitTi', selectedSolicitacao.id);
                                    await updateDoc(solicitacaoRef, {
                                        status: 'Enviado',
                                        heTook: heTook, // Grava o nome de quem está levando
                                        dateSend: new Date() // Opcional: registra a data de envio
                                    });
                                    setIsSendModalOpen(false); // Fecha o modal após salvar
                                    setHeTook(''); // Limpa o input após salvar
                                    handleStatusChange(selectedSolicitacao.id, 'Enviado'); // Chama handleStatusChange
                                } catch (error) {
                                    console.error('Erro ao atualizar solicitação:', error);
                                }
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                        >
                            Salvar
                        </button>
                        <button
                            onClick={() => {
                                setIsSendModalOpen(false);
                                setHeTook(''); // Limpa o input ao cancelar
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </Modal>


            <Modal
                isOpen={isCompleteModalOpen}
                onClose={() => {
                    setIsCompleteModalOpen(false);
                    setSelectedDate(null); // Limpa a data selecionada ao fechar o modal
                }}
            >
                <div className="text-center text-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Selecione a data de conclusão</h2>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        className="w-full p-2 border border-gray-300 rounded mb-4"
                        placeholderText="Selecione a data"
                        dateFormat="dd/MM/yyyy"
                    />
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={async () => {
                                if (!selectedDate) {
                                    alert('Por favor, selecione uma data antes de salvar.');
                                    return;
                                }
                                try {
                                    const solicitacaoRef = doc(db, 'solicitTi', selectedSolicitacao.id);
                                    await updateDoc(solicitacaoRef, {
                                        status: 'Concluído',
                                        dateReceived: selectedDate // Grava a data selecionada
                                    });
                                    setIsCompleteModalOpen(false); // Fecha o modal após salvar
                                    setSelectedDate(null); // Limpa a data após salvar
                                    handleStatusChange(selectedSolicitacao.id, 'Concluído'); // Chama handleStatusChange
                                } catch (error) {
                                    console.error('Erro ao atualizar solicitação:', error);
                                }
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                        >
                            Salvar
                        </button>

                        <button
                            onClick={() => {
                                setIsCompleteModalOpen(false);
                                setSelectedDate(null); // Limpa a data ao cancelar
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditReason(''); // Limpa o motivo ao fechar o modal
                }}
            >
                <div className="text-center text-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Alterar Itens da Solicitação</h2>
                    <div className="mb-4">
                        {Object.entries(editedItems).map(([itemNome, quantidade]) => (
                            <div key={itemNome} className="flex justify-between items-center mb-2">
                                <span>{itemNome}</span>
                                <input
                                    type="number"
                                    value={quantidade}
                                    min="1"
                                    onChange={(e) =>
                                        setEditedItems((prev) => ({
                                            ...prev,
                                            [itemNome]: parseInt(e.target.value, 10),
                                        }))
                                    }
                                    className="w-20 p-2 border border-gray-300 rounded"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Motivo da Alteração</h3>
                        <ReactQuill value={editReason} onChange={setEditReason} />
                    </div>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={handleSaveEdit}
                            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                        >
                            Salvar
                        </button>
                        <button
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setEditReason(''); // Limpa o motivo ao cancelar
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </Modal>

            <AlertModal
                isOpen={isAlertModalOpen}
                onRequestClose={() => setIsAlertModalOpen(false)}
                title="Campo Obrigatório"
                message="Por favor, preencha o motivo do cancelamento antes de salvar."
            />

            <AlertModal
                isOpen={sendAlertModalOpen}
                onRequestClose={() => setSendAlertModalOpen(false)}
                title="Campo Obrigatório"
                message="Por favor, preencha o nome de quem está levando antes de salvar."
            />

            <AlertModal
                isOpen={isEditAlertModalOpen}
                onRequestClose={() => setIsEditAlertModalOpen(false)}
                title="Motivo Obrigatório"
                message="Por favor, forneça um motivo para a alteração antes de salvar."
            />


        </div>
    );
};

export default AdmListaSolicitTi;
