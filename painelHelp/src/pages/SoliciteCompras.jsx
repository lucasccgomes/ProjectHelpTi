

import React, { useState, useEffect } from 'react';
import { collection, getDoc, getDocs, doc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ListaSolicitCompras from '../components/ListaSolicitCompras/ListaSolicitCompras';
import { MdOutlineRequestQuote } from "react-icons/md";
import Modal from 'react-modal';
import { useTransition, animated } from '@react-spring/web';
import AlertModal from '../components/AlertModal/AlertModal';
import Dropdown from '../components/Dropdown/Dropdown';
import NotificationModal from '../components/NotificationModal/NotificationModal';
import { IoIosSend } from "react-icons/io";
import AdmListaSolicitCompras from '../components/ListaSolicitCompras/AdmListaSolicitCompras';

Modal.setAppElement('#root'); // Ajuste o seletor conforme necessário


const SoliciteCompras = () => {
  const { currentUser, currentUserRole } = useAuth();
  const [tipo, setTipo] = useState('Reposição');
  const [nomeItem, setNomeItem] = useState('');
  const [motivo, setMotivo] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cidades, setCidades] = useState([]);
  const [selectedCidade, setSelectedCidade] = useState('');
  const [lojas, setLojas] = useState([]);
  const [selectedLoja, setSelectedLoja] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalContent, setAlertModalContent] = useState({ title: '', message: '', showOkButton: true });
  const [statusFilter, setStatusFilter] = useState('Todos'); // Adicionado statusFilter
  const [categorias, setCategorias] = useState([]);
  const [itensSolicitados, setItensSolicitados] = useState([{ categoria: '', item: '', quantidade: 1 }]);
  const [isSendingModalOpen, setIsSendingModalOpen] = useState(false); // Novo estado para o modal de envio

  const handleAddItem = () => {
    if (itensSolicitados.length < 3) {
      setItensSolicitados([...itensSolicitados, { categoria: '', item: '', quantidade: 1 }]);
    } else {
      setAlertModalContent({ title: 'Atenção', message: 'Você só pode adicionar até 3 itens.', showOkButton: true });
      setAlertModalOpen(true);
    }
  };

  const handleRemoveItem = (index) => {
    if (itensSolicitados.length > 1) {
      const novosItens = itensSolicitados.filter((_, i) => i !== index);
      setItensSolicitados(novosItens);
    } else {
      setAlertModalContent({ title: 'Atenção', message: 'Você deve ter pelo menos um item na solicitação.', showOkButton: true });
      setAlertModalOpen(true);
    }
  };

  useEffect(() => {
    const fetchCategorias = async () => {
      const estoqueRef = doc(db, 'estoqueCompras', 'estoque');
      const estoqueDoc = await getDoc(estoqueRef);
      if (estoqueDoc.exists()) {
        setCategorias(Object.keys(estoqueDoc.data()));
      }
    };
    fetchCategorias();
  }, []);

  useEffect(() => {
    const fetchItens = async (categoria) => {
      if (categoria) {
        const estoqueRef = doc(db, 'estoqueCompras', 'estoque');
        const estoqueDoc = await getDoc(estoqueRef);
        if (estoqueDoc.exists()) {
          const categoriaData = estoqueDoc.data()[categoria];
          return Object.keys(categoriaData);
        }
      }
      return [];
    };

    const atualizarItens = async () => {
      const novosItensSolicitados = await Promise.all(
        itensSolicitados.map(async (solicitado) => {
          if (solicitado.categoria) {
            const itensDaCategoria = await fetchItens(solicitado.categoria);
            return { ...solicitado, itensDisponiveis: itensDaCategoria };
          }
          return solicitado;
        })
      );
      setItensSolicitados(novosItensSolicitados);
    };

    if (itensSolicitados.length > 0) {
      atualizarItens();
    }
  }, [JSON.stringify(itensSolicitados)]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const usuariosRef = collection(db, 'usuarios');
      const querySnapshot = await getDocs(usuariosRef);
      querySnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData && userData[currentUser]) {
          setWhatsapp(userData[currentUser].whatsapp || '');
        }
      });
    };

    fetchUserDetails();
  }, [currentUser]);

  useEffect(() => {
    const fetchCidades = async () => {
      const cidadesRef = doc(db, 'ordersControl', 'cidades');
      const cidadesDoc = await getDoc(cidadesRef);
      if (cidadesDoc.exists()) {
        const cidadesData = cidadesDoc.data();
        if (currentUserRole === 'Supervisor') {
          setCidades(Object.keys(cidadesData));
        } else {
          const userCity = currentUser.cidade;
          if (userCity && cidadesData[userCity]) {
            setCidades([userCity]);
            setSelectedCidade(userCity);
          } else {
            setCidades([]);
          }
        }
      }
    };

    fetchCidades();
  }, [currentUser, currentUserRole]);

  useEffect(() => {
    const fetchLojas = async () => {
      const lojasRef = doc(db, 'ordersControl', 'cidades');
      const lojasDoc = await getDoc(lojasRef);
      if (lojasDoc.exists()) {
        const lojasData = lojasDoc.data();
        if (currentUserRole === 'Supervisor') {
          let allLojas = [];
          Object.keys(lojasData).forEach(city => {
            allLojas = [...allLojas, ...lojasData[city]];
          });
          setLojas(allLojas);
        } else if (selectedCidade && lojasData[selectedCidade]) {
          setLojas(lojasData[selectedCidade]);
        } else {
          setLojas([]);
        }
      }
    };

    if (currentUserRole === 'Supervisor' || selectedCidade) {
      fetchLojas();
    }
  }, [selectedCidade, currentUserRole]);

  useEffect(() => {
    if (selectedCidade) {
      const fetchLojas = async () => {
        const lojasRef = doc(db, 'ordersControl', 'cidades');
        const lojasDoc = await getDoc(lojasRef);
        if (lojasDoc.exists()) {
          setLojas(lojasDoc.data()[selectedCidade] || []);
        }
      };

      fetchLojas();
    } else {
      setLojas([]);
    }
  }, [selectedCidade]);

  const getNextSolicitacaoNumber = async () => {
    const soliciteControlRef = doc(db, 'ordersControl', 'soliciteCompras');
    try {
      const result = await runTransaction(db, async (transaction) => {
        const soliciteDoc = await transaction.get(soliciteControlRef);
        if (!soliciteDoc.exists()) {
          throw "Documento de controle de solicitações não encontrado!";
        }

        const soliciteControl = soliciteDoc.data().soliciteControl;
        const lastSolicitacao = soliciteControl[soliciteControl.length - 1];

        // Determina o prefixo atual e o próximo número
        let prefix = lastSolicitacao.slice(0, 3); // Extrai o prefixo (CPA, CPB, etc.)
        let lastNumber = parseInt(lastSolicitacao.slice(3), 10); // Extrai o número (001, 002, etc.)

        // Incrementa o número ou muda o prefixo
        if (lastNumber >= 999) {
          prefix = String.fromCharCode(prefix.charCodeAt(2) + 1).padStart(3, 'C');
          lastNumber = 1; // Reinicia o número para 001
        } else {
          lastNumber += 1;
        }

        const newSolicitacao = `${prefix}${String(lastNumber).padStart(3, '0')}`;

        soliciteControl.push(newSolicitacao);
        transaction.update(soliciteControlRef, { soliciteControl });

        return newSolicitacao;
      });
      return result;
    } catch (error) {
      console.error("Erro ao gerar o próximo número de solicitação: ", error);
      throw error;
    }
  };


  const fetchTITokens = async () => {
    const usuariosRef = collection(db, 'usuarios');
    const querySnapshot = await getDocs(usuariosRef);
    const tokens = [];

    querySnapshot.forEach(doc => {
      const userData = doc.data();
      Object.keys(userData).forEach(userKey => {
        const user = userData[userKey];
        if (user.cargo === 'T.I' && user.token) {
          tokens.push(user.token);
        }
      });
    });

    return tokens;
  };

  const sendNotification = async (tokens, notification) => {
    try {
      const response = await fetch('https://6f46-2804-1784-30b3-6700-6c8d-e16-5377-9e5c.ngrok-free.app/send-notification', {
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

      if (!response.ok) {
        throw new Error('Erro ao enviar notificações');
      }
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setIsSendingModalOpen(true); // Abrir o modal de envio

    try {
      const numSolicite = await getNextSolicitacaoNumber();

      const itensAgrupados = itensSolicitados.reduce((acc, { item, quantidade }) => {
        acc[item] = quantidade;
        return acc;
      }, {});

      const novaSolicitacao = {
        tipo,
        motivo,
        whatsapp: currentUser.whatsapp,
        user: currentUser.user,
        cargo: currentUserRole,
        cidade: selectedCidade,
        loja: selectedLoja,
        data: new Date(),
        status: "Pendente",
        numSolicite,
        item: itensAgrupados
      };

      // Gravação da nova solicitação na coleção solicitCompras
      await setDoc(doc(db, 'solicitCompras', numSolicite), novaSolicitacao);

      // Gravação no relatório
      const fullReportRef = doc(db, 'relatorioCompras', 'fullReport');
      const fullReportDoc = await getDoc(fullReportRef);
      const fullReportData = fullReportDoc.exists() ? fullReportDoc.data() : {};
      const timestamp = new Date().toISOString();

      const reportEntry = {
        usuario: currentUser.user,
        loja: selectedLoja,
        numSolicite: numSolicite,
        data: new Date().toISOString(),
        cargo: currentUserRole
      };

      await setDoc(fullReportRef, {
        ...fullReportData,
        [timestamp]: {
          [tipo]: reportEntry
        }
      });

      setSuccess(true);
      setAlertModalContent({ title: 'Sucesso', message: 'Solicitação enviada com sucesso!', showOkButton: true });

      // Limpar os campos após o envio
      setTipo('Reposição');
      setNomeItem('');
      setMotivo('');
      setSelectedCidade('');
      setSelectedLoja('');
      setItensSolicitados([{ categoria: '', item: '', quantidade: 1 }]);
    } catch (error) {
      setError('Erro ao adicionar solicitação');
      setAlertModalContent({ title: 'Erro', message: 'Erro ao adicionar solicitação', showOkButton: true });
      console.error('Erro ao adicionar solicitação:', error);
    } finally {
      setLoading(false);
      setIsSendingModalOpen(false); // Fechar o modal de envio
    }
  };

  const handleExternalSubmit = () => {
    const form = document.getElementById('soliciteForm');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const transitions = useTransition(modalIsOpen, {
    from: { opacity: 0, transform: 'translateY(-50%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(-50%)' },
  });

  const validateForm = () => {
    if (!tipo || !motivo || !selectedCidade || !selectedLoja || itensSolicitados.some(item => !item.categoria || !item.item || item.quantidade < 1)) {
      setAlertModalContent({ title: 'Atenção', message: 'Por favor, preencha todos os campos antes de enviar.', showOkButton: true });
      setAlertModalOpen(true);
      return false;
    }
    return true;
  };

  return (
    <div className="flex bg-altBlue lg:justify-between lg:flex-row flex-col">
      {currentUserRole !== 'Compras' && (
        <div id='criadorDeSolicitacao'>
          <div className="pt-20 hidden lg:block">
            <div className='p-5 bg-white border min-w-[400px] lg:ml-[8rem] m-4 lg:m-0 border-gray-300 rounded-xl shadow-lg'>
              <div className='flex justify-between'>
                <h2 className="text-xl font-bold mb-4 block text-gray-700">Nova Solicitação</h2>
                <button
                  type="button"
                  onClick={handleExternalSubmit}
                  className="max-w-20 gap-1 flex justify-center items-center bg-primaryBlueDark text-white p-2 rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-gray-200"
                  disabled={loading}
                >
                  <p>{loading ? 'Enviando...' : 'Enviar'}</p>
                  <IoIosSend />
                </button>

              </div>
              <form id="soliciteForm" onSubmit={handleSubmit} className="space-y-2">
                <div className='flex gap-2 flex-col'>
                  <div className="">
                    <Dropdown
                      label="Tipo de Solicitação"
                      options={['Reposição', 'Novo']}
                      selected={tipo}
                      onSelectedChange={(option) => setTipo(option)}
                      required
                    />
                  </div>
                  {itensSolicitados.map((solicitado, index) => (
                    <div key={index} className="flex gap-2 items-center -mt-1">
                      <Dropdown
                        options={categorias}
                        selected={solicitado.categoria || "Categoria"}
                        onSelectedChange={(categoria) => {
                          const novosItens = [...itensSolicitados];
                          novosItens[index].categoria = categoria;
                          novosItens[index].item = ''; // Resetar item ao mudar de categoria
                          setItensSolicitados(novosItens);
                        }}
                      />
                      <div className='min-w-36'>
                        <Dropdown
                          options={solicitado.itensDisponiveis || []}
                          selected={solicitado.item || "item"}
                          onSelectedChange={async (item) => {
                            const novosItens = [...itensSolicitados];
                            novosItens[index].item = item;

                            // Buscar o limite de quantidade do item selecionado
                            const estoqueRef = doc(db, 'estoqueCompras', 'estoque');
                            const estoqueDoc = await getDoc(estoqueRef);
                            if (estoqueDoc.exists()) {
                              const categoriaData = estoqueDoc.data()[novosItens[index].categoria];
                              const itemData = categoriaData[item];

                              if (itemData && itemData.quantityLimit !== undefined) {
                                novosItens[index].quantidadeLimite = itemData.quantityLimit;
                              } else {
                                novosItens[index].quantidadeLimite = 0;
                              }
                            }

                            setItensSolicitados(novosItens);
                          }}
                          disabled={!solicitado.categoria}
                        />
                      </div>
                      <div className="mt-2 flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (!solicitado.categoria || !solicitado.item) {
                              setAlertModalContent({ title: 'Atenção', message: 'Selecione uma categoria e um item antes de definir a quantidade.', showOkButton: true });
                              setAlertModalOpen(true);
                              return;
                            }

                            const novosItens = [...itensSolicitados];
                            const limite = solicitado.quantidadeLimite;

                            if (solicitado.quantidade > 1) {
                              novosItens[index].quantidade -= 1;
                              setItensSolicitados(novosItens);
                            } else {
                              setAlertModalContent({ title: 'Atenção', message: 'A quantidade mínima é 1.', showOkButton: true });
                              setAlertModalOpen(true);
                            }
                          }}
                          className="bg-gray-300 text-black p-2 rounded-l"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          label="Qtd"
                          value={solicitado.quantidade}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);

                            if (!solicitado.categoria || !solicitado.item) {
                              setAlertModalContent({ title: 'Atenção', message: 'Selecione uma categoria e um item antes de definir a quantidade.', showOkButton: true });
                              setAlertModalOpen(true);
                              return;
                            }

                            const novosItens = [...itensSolicitados];
                            const limite = solicitado.quantidadeLimite;

                            if (limite !== undefined && value <= limite) {
                              novosItens[index].quantidade = value;
                              setItensSolicitados(novosItens);
                            } else {
                              setAlertModalContent({ title: 'Atenção', message: `Você não pode pedir mais que ${limite || 0} deste item`, showOkButton: true });
                              setAlertModalOpen(true);
                            }
                          }}
                          className="w-12 border-t border-b border-gray-300 p-2 text-center focus:ring focus:ring-blue-200"
                          min="1"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!solicitado.categoria || !solicitado.item) {
                              setAlertModalContent({ title: 'Atenção', message: 'Selecione uma categoria e um item antes de definir a quantidade.', showOkButton: true });
                              setAlertModalOpen(true);
                              return;
                            }

                            const novosItens = [...itensSolicitados];
                            const limite = solicitado.quantidadeLimite;

                            if (limite !== undefined && solicitado.quantidade < limite) {
                              novosItens[index].quantidade += 1;
                              setItensSolicitados(novosItens);
                            } else {
                              setAlertModalContent({ title: 'Atenção', message: `Você não pode pedir mais que ${limite || 0} deste item`, showOkButton: true });
                              setAlertModalOpen(true);
                            }
                          }}
                          className="bg-gray-300 text-black p-2 rounded-r"
                        >
                          +
                        </button>
                      </div>
                      <div className='mt-2'>
                        {itensSolicitados.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="bg-red-500 text-white p-2 rounded mr-1"
                          >
                            -
                          </button>
                        )}
                        {index === itensSolicitados.length - 1 && itensSolicitados.length < 3 && (
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="bg-primaryBlueDark text-white p-2 rounded"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Motivo</label>
                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded max-h-14 focus:ring focus:ring-blue-200"
                    rows="4"
                    required
                  ></textarea>
                </div>
                {whatsapp && (
                  <div className='hidden'>
                    <label className="block mb-1 font-semibold">WhatsApp</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                      required
                    />
                  </div>
                )}
                <div className='flex gap-4'>
                  <div className='w-52'>
                    <Dropdown
                      label="Cidade"
                      options={cidades}
                      selected={selectedCidade || "Cidade"}
                      onSelectedChange={(option) => setSelectedCidade(option)}
                      openDirection='up'
                    />
                  </div>
                  <div className='w-24'>
                    <Dropdown
                      label="Loja"
                      options={lojas}
                      selected={selectedLoja || "Loja"}
                      onSelectedChange={(option) => setSelectedLoja(option)}
                      required
                      openDirection='up'
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="block lg:hidden p-4 pt-20">
            <button
              onClick={() => setModalIsOpen(true)}
              className="w-full bg-primaryBlueDark text-white p-2 flex justify-center items-center rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-gray-200"
            >
              <MdOutlineRequestQuote className='text-xl' /> Nova Solicitação
            </button>
          </div>


          {transitions(
            (styles, item) => item && (
              <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                className="modal flex items-center justify-center"
                overlayClassName="overlay"
                style={{
                  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
                  content: { transition: 'opacity 0.3s ease-in-out' }
                }}
              >
                <animated.div style={styles}>
                  <div className='p-3 bg-white border min-w-[150px] border-gray-300 rounded-xl shadow-lg '>
                    <div className='flex justify-between'>
                      <button
                        type="button"
                        onClick={() => setModalIsOpen(false)}
                        className="flex justify-center items-center bg-secRed text-white p-2 h-8 w-8 rounded-full hover:bg-red-700 shadow-xl"
                        disabled={loading}
                      >
                        <p>X</p>
                      </button>
                      <h2 className="text-xl font-bold mb-4 block text-gray-700">Nova Solicitação</h2>

                      <button
                        type="button"
                        onClick={handleExternalSubmit}
                        className="max-w-20 shadow-lg gap-1 flex justify-center items-center bg-primaryBlueDark text-white p-2 rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-gray-200"
                        disabled={loading}
                      >
                        <p>{loading ? 'Enviando...' : 'Enviar'}</p>
                        <IoIosSend />
                      </button>

                    </div>
                    <form id="soliciteForm" onSubmit={handleSubmit} className="space-y-2">
                      <div className='flex gap-2 flex-col'>
                        <div className="">
                          <Dropdown
                            label="Tipo de Solicitação"
                            options={['Reposição', 'Novo']}
                            selected={tipo}
                            onSelectedChange={(option) => setTipo(option)}
                            required
                          />
                        </div>
                        {itensSolicitados.map((solicitado, index) => (

                          <div className='flex justify-center'>
                            <div className='w-[70%]'>
                              <div key={index} className="flex gap-2 items-center -mt-1">
                                <div className='text-sm'>
                                  <Dropdown
                                    className="text-sm"
                                    options={categorias}
                                    selected={solicitado.categoria || "Categoria"}
                                    onSelectedChange={(categoria) => {
                                      const novosItens = [...itensSolicitados];
                                      novosItens[index].categoria = categoria;
                                      novosItens[index].item = ''; // Resetar item ao mudar de categoria
                                      setItensSolicitados(novosItens);
                                    }}
                                  />
                                </div>
                                <div className="mt-2 flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!solicitado.categoria || !solicitado.item) {
                                        setAlertModalContent({ title: 'Atenção', message: 'Selecione uma categoria e um item antes de definir a quantidade.', showOkButton: true });
                                        setAlertModalOpen(true);
                                        return;
                                      }

                                      const novosItens = [...itensSolicitados];
                                      const limite = solicitado.quantidadeLimite;

                                      if (solicitado.quantidade > 1) {
                                        novosItens[index].quantidade -= 1;
                                        setItensSolicitados(novosItens);
                                      } else {
                                        setAlertModalContent({ title: 'Atenção', message: 'A quantidade mínima é 1.', showOkButton: true });
                                        setAlertModalOpen(true);
                                      }
                                    }}
                                    className="bg-gray-300 text-black p-2 rounded-l"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    label="Qtd"
                                    value={solicitado.quantidade}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value, 10);

                                      if (!solicitado.categoria || !solicitado.item) {
                                        setAlertModalContent({ title: 'Atenção', message: 'Selecione uma categoria e um item antes de definir a quantidade.', showOkButton: true });
                                        setAlertModalOpen(true);
                                        return;
                                      }

                                      const novosItens = [...itensSolicitados];
                                      const limite = solicitado.quantidadeLimite;

                                      if (limite !== undefined && value <= limite) {
                                        novosItens[index].quantidade = value;
                                        setItensSolicitados(novosItens);
                                      } else {
                                        setAlertModalContent({ title: 'Atenção', message: `Você não pode pedir mais que ${limite || 0} deste item`, showOkButton: true });
                                        setAlertModalOpen(true);
                                      }
                                    }}
                                    className="w-12 border-t border-b border-gray-300 p-2 text-center focus:ring focus:ring-blue-200"
                                    min="1"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!solicitado.categoria || !solicitado.item) {
                                        setAlertModalContent({ title: 'Atenção', message: 'Selecione uma categoria e um item antes de definir a quantidade.', showOkButton: true });
                                        setAlertModalOpen(true);
                                        return;
                                      }

                                      const novosItens = [...itensSolicitados];
                                      const limite = solicitado.quantidadeLimite;

                                      if (limite !== undefined && solicitado.quantidade < limite) {
                                        novosItens[index].quantidade += 1;
                                        setItensSolicitados(novosItens);
                                      } else {
                                        setAlertModalContent({ title: 'Atenção', message: `Você não pode pedir mais que ${limite || 0} deste item`, showOkButton: true });
                                        setAlertModalOpen(true);
                                      }
                                    }}
                                    className="bg-gray-300 text-black p-2 rounded-r"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className='text-sm'>
                                <Dropdown
                                  options={solicitado.itensDisponiveis || []}
                                  selected={solicitado.item || "item"}
                                  onSelectedChange={async (item) => {
                                    const novosItens = [...itensSolicitados];
                                    novosItens[index].item = item;

                                    // Buscar o limite de quantidade do item selecionado
                                    const estoqueRef = doc(db, 'estoqueCompras', 'estoque');
                                    const estoqueDoc = await getDoc(estoqueRef);
                                    if (estoqueDoc.exists()) {
                                      const categoriaData = estoqueDoc.data()[novosItens[index].categoria];
                                      const itemData = categoriaData[item];

                                      if (itemData && itemData.quantityLimit !== undefined) {
                                        novosItens[index].quantidadeLimite = itemData.quantityLimit;
                                      } else {
                                        novosItens[index].quantidadeLimite = 0;
                                      }
                                    }

                                    setItensSolicitados(novosItens);
                                  }}
                                  disabled={!solicitado.categoria}
                                />
                              </div>
                            </div>

                            <div className='h-full mt-1 ml-1'>
                              {itensSolicitados.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="bg-red-500 text-white p-2 rounded mr-1 !h-[90px]"
                                >
                                  -
                                </button>
                              )}
                              {index === itensSolicitados.length - 1 && itensSolicitados.length < 3 && (
                                <button
                                  type="button"
                                  onClick={handleAddItem}
                                  className="bg-primaryBlueDark text-white p-2 rounded !h-[90px]"
                                >
                                  +
                                </button>
                              )}
                            </div>

                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Motivo</label>
                        <textarea
                          value={motivo}
                          onChange={(e) => setMotivo(e.target.value)}
                          className="w-full border border-gray-300 p-2 rounded max-h-14 focus:ring focus:ring-blue-200"
                          rows="4"
                          required
                        ></textarea>
                      </div>
                      {whatsapp && (
                        <div className='hidden'>
                          <label className="block mb-1 font-semibold">WhatsApp</label>
                          <input
                            type="text"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                            required
                          />
                        </div>
                      )}
                      <div className='flex gap-4'>
                        <div className='w-52'>
                          <Dropdown
                            label="Cidade"
                            options={cidades}
                            selected={selectedCidade || "Cidade"}
                            onSelectedChange={(option) => setSelectedCidade(option)}
                          />
                        </div>
                        <div className='w-24'>
                          <Dropdown
                            label="Loja"
                            options={lojas}
                            selected={selectedLoja || "Loja"}
                            onSelectedChange={(option) => setSelectedLoja(option)}
                            required
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                </animated.div>
              </Modal>
            )
          )}
        </div>
      )}
      <AlertModal
        isOpen={alertModalOpen}
        onRequestClose={() => setAlertModalOpen(false)}
        title={alertModalContent.title}
        message={alertModalContent.message}
        showOkButton={alertModalContent.showOkButton}
      />
      <AlertModal
        isOpen={isSendingModalOpen}
        onRequestClose={() => setIsSendingModalOpen(false)}
        title="Enviando"
        message="Sua solicitação está sendo enviada..."
        showOkButton={false}
        loading={true}
      />
      {currentUserRole !== 'Compras' && (
        <div className="">
          <ListaSolicitCompras statusFilter={statusFilter} />
        </div>
      )}
      {currentUserRole == 'Compras' && (
        <div className="w-full">
          <AdmListaSolicitCompras statusFilter={statusFilter} />
        </div>
      )}
      <NotificationModal />
    </div>
  );
};

export default SoliciteCompras;
