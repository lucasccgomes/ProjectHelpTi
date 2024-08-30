import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from 'react-responsive-carousel';
import Dropdown from '../Dropdown/Dropdown';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import MyModal from '../MyModal/MyModal';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { PiClockCountdownFill } from "react-icons/pi";
import { FaLocationCrosshairs } from "react-icons/fa6";
import { FaCity, FaUser, FaStoreAlt, FaFileImage, FaWhatsapp, FaCalendarCheck, FaCalendarTimes, FaHandSparkles } from "react-icons/fa";
import { MdReportProblem, MdDoNotDisturb, MdDescription, MdRecommend } from "react-icons/md";
import { GrDocumentConfig } from "react-icons/gr";
import { LuImageOff } from "react-icons/lu";


const AdmChamados = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProblem, setSelectedProblem] = useState('');
    const { currentUser } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [storeFilter, setStoreFilter] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [finalizadoDescricao, setFinalizadoDescricao] = useState('');
    const [imageModalIsOpen, setImageModalIsOpen] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [checkboxes, setCheckboxes] = useState([]);
    const [newCheckbox, setNewCheckbox] = useState('');
    const [checkproblema, setCheckproblema] = useState([]);
    const [conclusaoModalIsOpen, setConclusaoModalIsOpen] = useState(false);
    const [tratativaViewModalIsOpen, setTratativaViewModalIsOpen] = useState(false);
    const [tratativaEditModalIsOpen, setTratativaEditModalIsOpen] = useState(false);
    const [finalizarModalIsOpen, setFinalizarModalIsOpen] = useState(false);
    const [descricaoModalIsOpen, setDescricaoModalIsOpen] = useState(false);
    const [tentativaModalIsOpen, setTentativaModalIsOpen] = useState(false);

    const openTentativaModal = (ticket) => {
        setSelectedTicket(ticket);
        setTentativaModalIsOpen(true);
    };

    const closeTentativaModal = () => {
        setTentativaModalIsOpen(false);
    };

    const abreviarCidade = (cidade) => {
        const palavras = cidade.split(' ');
        if (palavras.length > 1) {
            const primeiraPalavra = palavras[0].substring(0, 3); // Abrevia a primeira palavra
            const ultimaPalavra = palavras[palavras.length - 1]; // Mantém a última palavra completa
            return `${primeiraPalavra}. ${ultimaPalavra}`;
        }
        return cidade; // Se for uma única palavra, retorna sem abreviação
    };

    const openDescricaoModal = (ticket) => {
        setSelectedTicket(ticket);
        setDescricaoModalIsOpen(true);
    };

    const closeDescricaoModal = () => {
        setDescricaoModalIsOpen(false);
    };

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ],
    };

    const [treatment, setTreatment] = useState('');

    const addNewCheckbox = async () => {
        if (newCheckbox) {
            try {
                const checkboxDocRef = doc(db, 'ordersControl', 'checkbox');
                const docSnapshot = await getDoc(checkboxDocRef);

                let updatedCheckboxes = [];
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    updatedCheckboxes = data.checkProblemas ? [...data.checkProblemas, newCheckbox] : [newCheckbox];
                } else {
                    updatedCheckboxes = [newCheckbox];
                }

                await updateDoc(checkboxDocRef, { checkProblemas: updatedCheckboxes });

                setCheckboxes(updatedCheckboxes);
                setNewCheckbox('');
            } catch (error) {
                console.error('Erro ao adicionar novo checkbox:', error);
            }
        }
    };

    useEffect(() => {
        const fetchCheckboxes = async () => {
            try {
                const checkboxDocRef = doc(db, 'ordersControl', 'checkbox');
                const docSnapshot = await getDoc(checkboxDocRef);
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    const checkboxesData = data.checkProblemas || [];
                    setCheckboxes(checkboxesData);
                } else {
                    console.log('Documento checkbox não encontrado.');
                }
            } catch (error) {
                console.error('Erro ao buscar documentos:', error);
            }
        };

        fetchCheckboxes();
    }, []);

    const formatWhatsappLink = (phone) => {
        const cleaned = ('' + phone).replace(/\D/g, '');
        const countryCode = '55';
        return `https://wa.me/${countryCode}${cleaned}`;
    };

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
        const fetchTickets = async () => {
            const abertoRef = collection(db, 'chamados', 'aberto', 'tickets');

            const unsubscribe = onSnapshot(abertoRef, (querySnapshot) => {
                const ticketsData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        data: data.data.toDate()
                    };
                });

                const uniqueTickets = Array.from(new Map(ticketsData.map(ticket => [ticket.id, ticket])).values());
                setTickets(uniqueTickets);
                setLoading(false);
            }, (error) => {
                console.error('Erro ao buscar chamados:', error);
                setLoading(false);
            });

            return () => unsubscribe();
        };

        fetchTickets();
    }, []);

    const sendNotification = async (tokens, notification) => {
        try {
            const response = await fetch('https://bde5-2804-1784-30b3-6700-7285-c2ff-fe34-e4b0.ngrok-free.app/send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tokens,
                    notification: {
                        title: notification.title,
                        body: notification.body,
                        click_action: notification.click_action,
                        icon: notification.icon
                    }
                })
            });
    
            const responseData = await response.json();
    
            if (response.ok) {
                console.log('Notificação enviada com sucesso.');
                console.log('Resposta do servidor:', responseData);
            } else {
                console.error('Falha ao enviar notificação. Status:', response.status);
                console.error('Resposta do servidor:', responseData);
            }
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
        }
    };    

    const updateTicketStatus = async (id, status, descricaoFinalizacao = '', treatment = '', interacao = null) => {
        try {
            const ticketDocRef = doc(db, 'chamados', 'aberto', 'tickets', id);
            
            // Prepara o objeto de atualização
            const updatedData = {
                status,
                descricaoFinalizacao,
                treatment,
                checkproblema: [selectedProblem],
            };
    
            // Adiciona a data de finalização se o status for "Finalizado"
            if (status === 'Finalizado') {
                updatedData.finalizadoData = new Date();
            }
    
            // Se interacao for falso e status for "Urgente", restaura o status anterior
            if (interacao === false && status === 'Urgente') {
                updatedData.status = selectedTicket.anteriorStatus || 'Aberto';
                updatedData.interacao = false;
            }
    
            // Só atualiza `interacao` se for passado como parâmetro (não `null`)
            if (interacao !== null) {
                updatedData.interacao = interacao;
            }
    
            // Atualiza o documento no Firestore
            await updateDoc(ticketDocRef, updatedData);
    
            // Atualiza o estado local
            setTickets(prevTickets =>
                prevTickets.map(ticket =>
                    ticket.id === id ? { ...ticket, ...updatedData } : ticket
                )
            );
    
            // Enviar notificação ao usuário
            const updatedTicket = tickets.find(ticket => ticket.id === id);
            const userDocRef = doc(db, 'usuarios', updatedTicket.cidade);
            const userDocSnap = await getDoc(userDocRef);
    
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data()[updatedTicket.user];
                if (userData && userData.token) {
                    const notificationMessage = {
                        title: `Status do Chamado ${updatedTicket.order} Alterado`,
                        body: `O status do chamado foi alterado para: ${status}`,
                        click_action: "https://drogalira.com.br/usertickets",
                        icon: "https://iili.io/duTTt8Q.png"
                    };
    
                    await sendNotification(userData.token, notificationMessage);
                } else {
                    console.error('Token do usuário não encontrado.');
                }
            } else {
                console.error('Documento do usuário não encontrado.');
            }
    
            // Limpa os estados
            setSelectedTicket(null);
            setFinalizadoDescricao('');
            setTreatment('');
            setCheckproblema([]);
        } catch (error) {
            console.error('Erro ao atualizar status do chamado:', error);
        }
    };
    
    const filteredTickets = tickets.filter(ticket => {
        const query = searchQuery.toLowerCase();

        return (
            (statusFilter ? ticket.status === statusFilter : true) &&
            (userFilter ? ticket.user === userFilter : true) &&
            (storeFilter ? ticket.loja === storeFilter : true) &&
            (
                ticket.user.toLowerCase().includes(query) ||
                ticket.status.toLowerCase().includes(query) ||
                ticket.descricaoFinalizacao?.toLowerCase().includes(query) ||
                ticket.cidade.toLowerCase().includes(query) ||
                ticket.descricao?.toLowerCase().includes(query) ||
                ticket.localProblema?.toLowerCase().includes(query) ||
                (ticket.checkproblema && ticket.checkproblema.some(cp => cp.toLowerCase().includes(query))) ||
                ticket.loja.toLowerCase().includes(query)
            )
        );
    });

    const uniqueUsers = [...new Set(tickets.map(ticket => ticket.user))];
    const uniqueStores = [...new Set(tickets.map(ticket => ticket.loja))];

    if (loading) {
        return <div>Loading...</div>;
    }

    const openImageModal = (images) => {
        setSelectedImages(images);
        setImageModalIsOpen(true);
    };

    const closeImageModal = () => {
        setSelectedImages([]);
        setImageModalIsOpen(false);
    };

    const openTratativaViewModal = (ticket) => {
        setSelectedTicket(ticket);
        setTratativaViewModalIsOpen(true);
    };

    const closeTratativaViewModal = () => {
        setTratativaViewModalIsOpen(false);
    };

    const openTratativaEditModal = (ticket) => {
        setSelectedTicket(ticket);
        setTreatment(ticket.treatment || '');
        setTratativaEditModalIsOpen(true);
    };

    const closeTratativaEditModal = () => {
        setTratativaEditModalIsOpen(false);
    };

    const openFinalizarModal = (ticket) => {
        setSelectedTicket(ticket);
        setFinalizarModalIsOpen(true);
    };

    const closeFinalizarModal = () => {
        setFinalizarModalIsOpen(false);
    };

    const openConclusaoModal = (ticket) => {
        setSelectedTicket(ticket);
        setConclusaoModalIsOpen(true);
    };

    const closeConclusaoModal = () => {
        setConclusaoModalIsOpen(false);
    };

    return (
        <div className="justify-center items-center">
            <div className='w-full bg-altBlue p-4 fixed mt-[3.5rem] z-10'>
                <div className='flex flex-col bg-primaryBlueDark p-4 rounded-lg shadow-lg '>
                    <h2 className="text-2xl text-white font-bold">Gerenciador Chamados</h2>
                    <div className='flex justify-between gap-4'>
                        <input
                            type="text"
                            className="border mt-2 p-2 rounded w-full"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className='w-[27rem]'>
                            <Dropdown
                                options={['Todos', 'Aberto', 'Andamento', 'Finalizado', 'VSM']}
                                selected={statusFilter}
                                onSelectedChange={(value) => setStatusFilter(value === 'Todos' ? '' : value)}
                                className="hidden lg:flex items-center justify-center"
                            />
                        </div>
                        <div className='w-[27rem] '>
                            <Dropdown
                                options={['Todos', ...uniqueUsers]}
                                selected={userFilter}
                                onSelectedChange={(value) => {
                                    setUserFilter(value === 'Todos' ? '' : value);
                                    if (value !== '') {
                                        setStoreFilter(''); // Reseta o filtro de loja para "Todos"
                                    }
                                }}
                                className="hidden lg:flex items-center justify-center"
                            />
                        </div>
                        <div className='w-[27rem]'>
                            <Dropdown
                                options={['Todos', ...uniqueStores]}
                                selected={storeFilter}
                                onSelectedChange={(value) => {
                                    setStoreFilter(value === 'Todos' ? '' : value);
                                    if (value !== '') {
                                        setUserFilter(''); // Reseta o filtro de usuário para "Todos"
                                    }
                                }}

                                className="hidden lg:flex items-center justify-center"
                            />
                        </div>
                    </div>

                </div>
            </div>

            {filteredTickets.length === 0 ? (
                <p>Nenhum chamado encontrado.</p>
            ) : (

                <div className="pt-52 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full bg-altBlue">
                    {filteredTickets
                        .sort((a, b) => {
                            if (a.interacao && !b.interacao) return -1;
                            if (!a.interacao && b.interacao) return 1;

                            const statusPriority = (status) => {
                                switch (status) {
                                    case 'Urgente':
                                        return 1;
                                    case 'Aberto':
                                        return 2;
                                    case 'Andamento':
                                        return 3;
                                    default:
                                        return 4;
                                }
                            };

                            return statusPriority(a.status) - statusPriority(b.status);
                        })
                        .map(ticket => (
                            <div
                                key={ticket.id}
                                className={`bg-white shadow-xl mb-4 px-4 pb-4 rounded-xl ${ticket.interacao ? 'animate-shake hover:animate-none' : ''}`}
                            >
                                <div className="text-xl uppercase text-center font-semibold">
                                    <div className='flex justify-between'>
                                        <h1 className='bg-altBlue text-white p-2 rounded-b-xl shadow-xl'>
                                            {ticket.order}
                                        </h1>
                                        <div className={`p-1 rounded-b-xl shadow-xl ${getStatusClass(ticket.status)}`}>
                                            <p className={`my-1 p-1 uppercase ${getStatusClass(ticket.status)} ${ticket.status === 'Urgente' ? 'animate-[pulseUrgent_2s_ease-in-out_infinite]' : 'text-white'}`}>
                                                {ticket.status}
                                            </p>

                                        </div>
                                        <div className='bg-altBlue text-white p-2 rounded-b-xl shadow-xl'>
                                            <p className='bg-green-600 p-2 rounded-2xl shadow-lg'>
                                                <a target='_blank' href={formatWhatsappLink(ticket.whatsapp)}>
                                                    <FaWhatsapp className='text-2xl text-white' />
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className='flex justify-between gap-4 mb-1 mt-2'>
                                    <div className="flex">
                                        <FaCity className="mr-2 text-primaryBlueDark text-xl" />
                                        <p className='font-semibold text-gray-700'>
                                            {abreviarCidade(ticket.cidade)}
                                        </p>
                                    </div>
                                    <div className="flex">
                                        <FaUser className="mr-2 text-primaryBlueDark text-xl" />
                                        <p className='font-semibold text-gray-700'>
                                            {ticket.user}
                                        </p>
                                    </div>
                                    <div className="flex">
                                        <FaStoreAlt className="mr-2 text-primaryBlueDark text-xl" />
                                        <p className='font-semibold text-gray-700'>
                                            {ticket.loja}
                                        </p>
                                    </div>
                                </div>
                                <div className='flex justify-between my-2'>
                                    <div className="flex">
                                        <FaCalendarTimes className="mr-2 text-primaryBlueDark text-xl" />
                                        <p className='font-semibold text-gray-700'>
                                            {ticket.data.toLocaleString()}
                                        </p>
                                    </div>
                                    {ticket.finalizadoData && (
                                        <div className="flex">
                                            <FaCalendarCheck className="mr-2 text-primaryBlueDark text-xl" />
                                            <p className='font-semibold text-gray-700'>
                                                {ticket.finalizadoData.toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className='flex justify-between bg-altBlue p-2 rounded-xl mb-2'>
                                    <div className='flex justify-center items-center bg-orange-100 rounded-xl px-3'>
                                        <FaLocationCrosshairs className="mr-2 text-primaryBlueDark text-xl" />
                                        <p className='font-semibold text-gray-700'>
                                            {ticket.localProblema}
                                        </p>
                                    </div>
                                    <div className='bg-orange-100 rounded-xl px-3'>
                                        {ticket.checkproblema && ticket.checkproblema.length > 0 && ticket.checkproblema.some(item => item.trim() !== "") ? (
                                            <ul>
                                                {ticket.checkproblema.map((checkbox, index) => (
                                                    checkbox.trim() !== "" && ( // Adiciona esta condição para evitar a exibição de itens vazios
                                                        <li key={index} className='flex justify-center items-center font-bold'>
                                                            <MdReportProblem className="mr-2 text-primaryBlueDark text-xl" />
                                                            <p className='font-semibold text-gray-700'>
                                                                {checkbox}
                                                            </p>
                                                        </li>
                                                    )
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className='flex justify-center items-center'>
                                                <MdDoNotDisturb className="mr-2 text-primaryBlueDark text-xl" />
                                                <p className='font-semibold text-gray-700'>
                                                    Aguardando
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                </div>
                                <div className='flex justify-between gap-4'>
                                    <div className='bg-white pt-0 rounded-md mb-2 w-full'>
                                        <button
                                            className='bg-primaryBlueDark gap-2 text-white px-4 py-2 rounded-md w-full flex justify-center items-center'
                                            onClick={() => openDescricaoModal(ticket)}
                                        >
                                            <MdDescription />
                                            <p>Descrição</p>
                                        </button>
                                    </div>
                                    <div className='bg-white pt-0 rounded-md w-full'>
                                        <button
                                            className='bg-primaryBlueDark gap-2 text-white px-4 py-2 rounded-md w-full flex justify-center items-center'
                                            onClick={() => openTentativaModal(ticket)}
                                        >
                                            <FaHandSparkles />
                                            <p>Tentativa</p>
                                        </button>
                                    </div>
                                </div>
                                <div className='flex justify-between items-center gap-4'>
                                    {Array.isArray(ticket.imgUrl) && ticket.imgUrl.length > 0 ? (
                                        <div className='flex items-center justify-center w-full'>
                                            <button
                                                className='bg-primaryBlueDark gap-2 flex justify-center items-center w-full text-white px-4 py-2 rounded-md'
                                                onClick={() => openImageModal(ticket.imgUrl)}
                                            >
                                                <FaFileImage />
                                                <p>Imagens</p>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className='flex items-center justify-center w-full'>
                                            <button
                                                className='bg-gray-600 pointer-events-none w-full flex justify-center items-center text-white px-4 py-2 rounded'
                                            >
                                                <LuImageOff />
                                                <p>Imagens</p>
                                            </button>
                                        </div>
                                    )}
                                    {ticket.treatment ? (
                                        <div className='w-full'>
                                            <button
                                                onClick={() => openTratativaViewModal(ticket)}
                                                className='bg-orange-600 gap-2 flex justify-center items-center w-full text-white px-4 py-2 rounded-md'
                                            >
                                                <GrDocumentConfig />
                                                <p>Tratativa</p>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className='w-full'>
                                            {ticket.descricaoFinalizacao ? (
                                                <div className='w-full '>
                                                    <button
                                                        onClick={() => openConclusaoModal(ticket)}
                                                        className='bg-green-600 gap-2 flex justify-center items-center w-full text-white px-4 py-2 rounded-md'
                                                    >
                                                        <MdRecommend />
                                                        <p>Conclusão</p>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className='w-full'>
                                                    <button
                                                        className='bg-gray-500 gap-2 cursor-not-allowed  w-full pointer-events-none flex justify-center items-center text-white px-4 py-2 rounded'
                                                    >
                                                        <PiClockCountdownFill className="text-xl" />
                                                        <p>
                                                            Aguardando
                                                        </p>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 mt-2 w-full justify-between border-2 rounded-md p-2">
                                    <p className='text-gray-800 font-semibold text-center text-xl'>Alteração de Status</p>
                                    <div className='flex w-full justify-between'>
                                        <button
                                            onClick={() => updateTicketStatus(ticket.id, 'Aberto')}
                                            className={`bg-red-400 w-full text-white px-4 py-2 rounded mr-2 ${ticket.status === 'Finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'Aberto' ? 'bg-red-600 ring-2 ring-white' : ''}`}
                                            disabled={ticket.status === 'Finalizado'}
                                        >
                                            Aberto
                                        </button>
                                        <button
                                            onClick={() => openTratativaEditModal(ticket)}
                                            className={`bg-orange-400 w-full text-white px-4 py-2 rounded ${ticket.status === 'Finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'Andamento' ? 'bg-orange-600 ring-2 ring-white' : ''}`}
                                            disabled={ticket.status === 'Finalizado'}
                                        >
                                            Andamento
                                        </button>
                                        <button
                                            onClick={() => openFinalizarModal(ticket)}
                                            className={`bg-green-400 w-full text-white px-4 py-2 rounded ml-2 ${ticket.status === 'Finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'Finalizado' ? 'bg-green-600 ring-2 ring-white' : ''}`}
                                            disabled={ticket.status === 'Finalizado'}
                                        >
                                            Finalizado
                                        </button>
                                    </div>
                                    <div className='flex justify-between gap-2'>
                                        <button
                                            onClick={() => updateTicketStatus(ticket.id, 'VSM')}
                                            className={`bg-blue-400 text-white px-4 w-full py-2 rounded ${ticket.status === 'Finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'VSM' ? 'bg-blue-700 ring-2 ring-white' : ''}`}
                                            disabled={ticket.status === 'Finalizado'}
                                        >
                                            (VSM)-Externo
                                        </button>
                                        {ticket.interacao && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updateTicketStatus(ticket.id, 'Urgente')}
                                                    className="bg-red-500 text-white px-4 py-2 rounded w-full"
                                                >
                                                    Urgente
                                                </button>
                                                <button
                                                    onClick={() => updateTicketStatus(ticket.id, ticket.anteriorStatus, '', '', false)}
                                                    className="bg-gray-500 text-white px-4 py-2 rounded w-full"
                                                >
                                                    Normalizar
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>
                        ))}
                </div>

            )}

            {finalizarModalIsOpen && (
                <MyModal isOpen={finalizarModalIsOpen} onClose={closeFinalizarModal}>
                    <h2 className="text-xl mb-2 font-bold text-center">Finalizar Chamado</h2>
                    <ReactQuill
                        value={finalizadoDescricao}
                        onChange={setFinalizadoDescricao}
                        modules={modules}
                        placeholder="Adicione uma descrição de finalização..."
                        className="mb-12 h-28"
                    />
                    <div className="mb-2">
                        <h3 className='font-bold text-center'>Problemas encontrados</h3>
                        <Dropdown
                            options={checkboxes}
                            label="Selecione um problema"
                            selected={selectedProblem}
                            onSelectedChange={(problem) => setSelectedProblem(problem)}
                        />
                        <div className="flex gap-2 mt-2">
                            <input
                                type="text"
                                value={newCheckbox}
                                onChange={(e) => setNewCheckbox(e.target.value)}
                                className="border p-2"
                                placeholder="Adicionar novo problema"
                            />
                            <button onClick={addNewCheckbox} className="bg-blue-500 text-white px-4 py-2 rounded">
                                +
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                updateTicketStatus(selectedTicket.id, 'Finalizado', finalizadoDescricao);
                                closeFinalizarModal();
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                            Salvar
                        </button>
                        <button
                            onClick={closeFinalizarModal}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                    </div>
                </MyModal>
            )}


            {tratativaEditModalIsOpen && (
                <MyModal isOpen={tratativaEditModalIsOpen} onClose={closeTratativaEditModal}>
                    <h2 className="text-xl mb-2 font-bold text-center">Tratativa</h2>
                    <ReactQuill
                        value={treatment}
                        onChange={setTreatment}
                        modules={modules}
                        placeholder="Descreva a tratativa..."
                        className="mb-12 h-28"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                updateTicketStatus(selectedTicket.id, 'Andamento', '', treatment);
                                closeTratativaEditModal();
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                            Salvar
                        </button>
                        <button
                            onClick={closeTratativaEditModal}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                    </div>
                </MyModal>
            )}


            <MyModal isOpen={imageModalIsOpen} onClose={closeImageModal}>
                <div className="bg-white p-4 rounded">
                    <Carousel
                        showArrows={true}
                        showStatus={false}
                        showIndicators={false}
                        showThumbs={false}
                        infiniteLoop={true}
                        useKeyboardArrows
                        centerMode
                        swipeable
                    >
                        {selectedImages.map((image, index) => (
                            <div key={index} className="flex justify-center">
                                <Zoom>
                                    <img src={image} alt={`Imagem ${index}`} className="max-w-full max-h-[450px]" />
                                </Zoom>
                            </div>
                        ))}
                    </Carousel>
                    <button onClick={closeImageModal} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
                        Fechar
                    </button>
                </div>
            </MyModal>

            <MyModal isOpen={conclusaoModalIsOpen} onClose={closeConclusaoModal}>
                <h2 className="text-xl font-bold mb-4">Conclusão</h2>
                {selectedTicket && (
                    <div
                        className="overflow-y-auto break-words"
                        dangerouslySetInnerHTML={{ __html: selectedTicket.descricaoFinalizacao }}
                    ></div>
                )}
            </MyModal>

            <MyModal isOpen={tratativaViewModalIsOpen} onClose={closeTratativaViewModal}>
                <h2 className="text-xl font-bold mb-4">Tratativa</h2>
                {selectedTicket && (
                    <div
                        className="overflow-y-auto break-words"
                        dangerouslySetInnerHTML={{ __html: selectedTicket.treatment }}
                    ></div>
                )}
            </MyModal>

            <MyModal isOpen={descricaoModalIsOpen} onClose={closeDescricaoModal}>
                <h2 className="text-xl font-bold mb-4">Descrição</h2>
                {selectedTicket && (
                    <div
                        className="overflow-y-auto break-words"
                        dangerouslySetInnerHTML={{ __html: selectedTicket.descricao }}
                    ></div>
                )}
            </MyModal>

            <MyModal isOpen={tentativaModalIsOpen} onClose={closeTentativaModal}>
                <h2 className="text-xl font-bold mb-4">Tentativa</h2>
                {selectedTicket && (
                    <div
                        className="overflow-y-auto break-words"
                        dangerouslySetInnerHTML={{ __html: selectedTicket.tentou }}
                    ></div>
                )}
            </MyModal>


        </div>
    );
};

export default AdmChamados;
