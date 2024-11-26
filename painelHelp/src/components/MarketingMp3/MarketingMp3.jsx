import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import MyModal from '../MyModal/MyModal';
import AlertModal from '../AlertModal/AlertModal';

const MarketingMp3 = () => {
    const [servers, setServers] = useState([]);
    const [selectedServer, setSelectedServer] = useState('');
    const [file, setFile] = useState(null);
    const [files, setFiles] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [alertIsOpen, setAlertIsOpen] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertLoading, setAlertLoading] = useState(false);
    const [timeModalIsOpen, setTimeModalIsOpen] = useState(false);
    const [timeInfo, setTimeInfo] = useState('');
    const [currentMusic, setCurrentMusic] = useState('');
    const [intervalId, setIntervalId] = useState(null); // Para armazenar o ID do intervalo
    const [scheduleModalIsOpen, setScheduleModalIsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [isScheduleSaved, setIsScheduleSaved] = useState(false);



    const MP3_LIST_API_URL = import.meta.env.VITE_MP3_LIST;
    const MP3_UPLOAD_API_URL = import.meta.env.VITE_MP3_UPLOAD;
    const VITE_MP3_DELETE_API_URL = import.meta.env.VITE_MP3_DELETE;

    // Função para abrir o AlertModal com título, mensagem e estado de carregamento específicos
    const showAlert = (title, message, loading = false) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertLoading(loading);
        setAlertIsOpen(true);
    };

    const startRealTimeUpdate = () => {
        const lojaFormatted = selectedServer.replace(/-/g, ' ');

        const id = setInterval(async () => {
            try {
                const timeResponse = await fetch(import.meta.env.VITE_MP3_CONTROL_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        loja: lojaFormatted,
                        action: "time",
                    }),
                });

                const currentResponse = await fetch(import.meta.env.VITE_MP3_CONTROL_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        loja: lojaFormatted,
                        action: "current",
                    }),
                });

                const timeData = await timeResponse.json();
                const currentData = await currentResponse.json();

                if (timeResponse.ok && currentResponse.ok) {
                    setTimeInfo(timeData.output || 'Tempo não disponível');
                    setCurrentMusic(currentData.output || 'Música não disponível');
                } else {
                    console.error("Erro ao atualizar informações de tempo ou música atual.");
                }
            } catch (error) {
                console.error("Erro ao obter informações de tempo em tempo real:", error);
            }
        }, 1000); // Atualiza a cada segundo

        setIntervalId(id);
    };

    const stopRealTimeUpdate = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
    };

    useEffect(() => {
        const fetchServers = async () => {
            try {
                const serverCollection = collection(db, "grenciaServers");
                const serverSnapshot = await getDocs(serverCollection);
                const serversList = serverSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setServers(serversList);
            } catch (error) {
                console.error("Erro ao carregar servidores:", error);
            }
        };
        fetchServers();
    }, []);

    const fetchFiles = async (serverId) => {
        try {
            const response = await fetch(MP3_LIST_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverId })
            });
            const data = await response.json();
            setFiles(data.files);
        } catch (error) {
            console.error("Erro na solicitação de listagem de arquivos:", error);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === "audio/mpeg") {
            setFile(selectedFile);
        } else {
            showAlert("Erro de arquivo", "Por favor, selecione um arquivo MP3.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedServer || !file) {
            showAlert("Erro de envio", "Por favor, selecione uma loja e um arquivo MP3.");
            return;
        }

        setModalIsOpen(true);
        setProgress(0);
        setUploadComplete(false);

        const formData = new FormData();
        formData.append('serverId', selectedServer);
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", MP3_UPLOAD_API_URL, true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 90;
                setProgress(Math.round(percentComplete));
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.message === "Arquivo enviado com sucesso!") {
                    setProgress(100);
                    setUploadComplete(true);
                    fetchFiles(selectedServer);
                } else {
                    showAlert("Erro de envio", response.error || "Erro ao enviar o arquivo.");
                    setModalIsOpen(false);
                }
            } else {
                showAlert("Erro de envio", "Erro ao enviar o arquivo.");
                setModalIsOpen(false);
            }
        };

        xhr.onerror = () => {
            showAlert("Erro de conexão", "Erro ao enviar o arquivo.");
            setModalIsOpen(false);
        };

        xhr.send(formData);
    };

    const handleDelete = async (filename) => {
        showAlert("Deletando", "Enviando solicitação...", true); // Define o modal como "carregando"
        try {
            const response = await fetch(VITE_MP3_DELETE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverId: selectedServer, filename })
            });
            const data = await response.json();

            if (response.ok) {
                showAlert("Sucesso", data.message || "Arquivo deletado com sucesso!");
                fetchFiles(selectedServer);
            } else {
                showAlert("Erro de exclusão", data.error || "Erro ao deletar o arquivo.");
            }
        } catch (error) {
            console.error("Erro ao deletar o arquivo:", error);
            showAlert("Erro de exclusão", "Erro ao deletar o arquivo.");
        } finally {
            setAlertLoading(false); // Remove o estado de "carregando" ao final da requisição
        }
    };

    const sendMusicControlCommand = async (action, filename = null) => {
        if (!selectedServer) {
            showAlert("Erro", "Selecione uma loja antes de executar comandos.");
            return;
        }

        const lojaFormatted = selectedServer.replace(/-/g, ' ');

        console.log("Enviando dados para a API:", { loja: lojaFormatted, action, filename });

        try {
            if (action === "time") {
                // Obter informações de tempo e música atual
                const timeResponse = await fetch(import.meta.env.VITE_MP3_CONTROL_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        loja: lojaFormatted,
                        action: "time",
                    }),
                });

                const currentResponse = await fetch(import.meta.env.VITE_MP3_CONTROL_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        loja: lojaFormatted,
                        action: "current",
                    }),
                });

                const timeData = await timeResponse.json();
                const currentData = await currentResponse.json();

                if (timeResponse.ok && currentResponse.ok) {
                    setTimeInfo(timeData.output || 'Tempo não disponível');
                    setCurrentMusic(currentData.output || 'Música não disponível');
                    setTimeModalIsOpen(true);
                } else {
                    showAlert("Erro", "Erro ao obter informações de tempo ou música atual.");
                }
            } else {
                // Comandos normais
                const response = await fetch(import.meta.env.VITE_MP3_CONTROL_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        loja: lojaFormatted,
                        action,
                        filename, // Envia o nome do arquivo aqui
                    }),
                });

                const data = await response.json();
                if (response.ok) {
                    showAlert("Sucesso", data.message);
                    if (action === "list") {
                        setFiles(data.files || []);
                    }
                } else {
                    showAlert("Erro", data.error || "Erro ao executar comando.");
                }
            }
        } catch (error) {
            console.error("Erro ao enviar comando:", error);
            showAlert("Erro", "Erro ao executar comando.");
        }
    };

    const handleSaveSchedule = async () => {
        if (!selectedDate || !selectedFile || !selectedServer) {
            showAlert("Erro", "Por favor, selecione uma data, um arquivo e uma loja.");
            return;
        }
    
        try {
            const formattedDate = selectedDate.split('-').reverse().join('/'); // Formata a data para dd/mm/aaaa
            const lojaFormatted = selectedServer.replace(/-/g, ' '); // Substitui traços por espaços no nome da loja
    
            // Obtenha a referência ao documento "agendaPlayer" dentro da coleção "webPanfleto"
            const docRef = doc(db, "webPanfleto", "agendaPlayer");
    
            // Atualize o documento com os dados da agenda
            await setDoc(
                docRef,
                {
                    [formattedDate]: {
                        filename: selectedFile,
                        data: selectedDate,
                        loja: lojaFormatted, // Adiciona o campo loja com o nome formatado
                    },
                },
                { merge: true } // Garante que os dados existentes não sejam sobrescritos
            );
    
            setIsScheduleSaved(true); // Marca como salvo
            showAlert("Sucesso", "Agendamento salvo com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar agendamento:", error);
            showAlert("Erro", "Erro ao salvar agendamento.");
        }
    };
    

    return (
        <div className="max-w-md mx-auto pt-24">
            <div className='bg-white p-4 shadow-md rounded-md'>
                <h2 className="text-2xl font-semibold text-center mb-4">Upload de MP3 para Lojas</h2>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="server" className="block text-sm font-medium text-gray-700">
                        Selecionar Loja
                    </label>
                    <select
                        id="server"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={selectedServer}
                        onChange={(e) => {
                            setSelectedServer(e.target.value);
                            fetchFiles(e.target.value);
                        }}
                    >
                        <option value="">Selecione uma Loja</option>
                        {servers.map((server) => (
                            <option key={server.id} value={server.id}>
                                {server.id}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="file" className="block text-sm font-medium text-gray-700 mt-4">
                        Selecione o arquivo MP3
                    </label>
                    <input
                        type="file"
                        id="file"
                        accept=".mp3"
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        onChange={handleFileChange}
                    />

                    <button
                        type="submit"
                        className="mt-4 w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        disabled={loading}
                    >
                        Enviar MP3
                    </button>
                </form>

                <h3 className="text-xl font-semibold text-center mt-8">Arquivos MP3 na Loja</h3>
                <ul className="mt-4 h-40 overflow-auto">
                    {files.map((filename) => (
                        <li key={filename} className="flex justify-between items-center p-2 border-b">
                            <span className="text-xs">{filename}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => sendMusicControlCommand("choose", filename)}
                                    className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600"
                                >
                                    Tocar
                                </button>
                                <button
                                    onClick={() => handleDelete(filename)}
                                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                >
                                    Excluir
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedFile(filename);
                                        setScheduleModalIsOpen(true);
                                        setIsScheduleSaved(false);
                                    }}
                                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                >
                                    Agendar
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="mt-6 ">
                    <h3 className="text-lg font-semibold mb-4">Controles de Música</h3>
                    <div className="flex justify-between flex-wrap gap-4">
                        <button
                            onClick={() => sendMusicControlCommand("play")}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            Play
                        </button>
                        <button
                            onClick={() => sendMusicControlCommand("stop")}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                            Stop
                        </button>
                        <button
                            onClick={() => {
                                setTimeModalIsOpen(true);
                                startRealTimeUpdate();
                            }}
                            className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600"
                        >
                            Time
                        </button>
                    </div>
                </div>
                <MyModal
                    isOpen={timeModalIsOpen}
                    onRequestClose={() => {
                        setTimeModalIsOpen(false);
                        stopRealTimeUpdate();
                    }}
                >
                    <div className="text-center">
                        <h2 className="text-lg font-semibold">Informações da Reprodução</h2>
                        <p className="mt-4"><strong>Tempo de execução:</strong> {timeInfo}</p>
                        <p className="mt-2"><strong>Música atual:</strong> {currentMusic}</p>
                        <button
                            onClick={() => {
                                setTimeModalIsOpen(false);
                                stopRealTimeUpdate();
                            }}
                            className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                        >
                            Fechar
                        </button>
                    </div>
                </MyModal>
                <MyModal isOpen={modalIsOpen} showCloseButton={false}>
                    <div className="text-center">
                        <h2 className="text-lg font-semibold">Enviando arquivo...</h2>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                            <div
                                className="bg-indigo-600 h-2.5 rounded-full"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        {progress === 100 && (
                            <>
                                <p className="mt-2 text-green-600">Upload concluído com sucesso!</p>
                                <button
                                    onClick={() => setModalIsOpen(false)}
                                    className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                                >
                                    OK
                                </button>
                            </>
                        )}
                    </div>
                </MyModal>

                <MyModal
                    isOpen={scheduleModalIsOpen}
                    onRequestClose={() => setScheduleModalIsOpen(false)}
                >
                    <div className="text-center">
                        <h2 className="text-lg font-semibold">Agendar Reprodução</h2>
                        <p className="mt-2 text-sm">Arquivo: <strong>{selectedFile}</strong></p>

                        <div className="mt-4">
                            <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700">
                                Selecione uma data:
                            </label>
                            <input
                                type="date"
                                id="schedule-date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>

                        <button
                            onClick={isScheduleSaved ? () => setScheduleModalIsOpen(false) : handleSaveSchedule}
                            className={`mt-4 w-full ${isScheduleSaved ? "bg-green-500 hover:bg-green-600" : "bg-indigo-600 hover:bg-indigo-700"
                                } text-white py-2 px-4 rounded-md`}
                        >
                            {isScheduleSaved ? "Fechar" : "Salvar"}
                        </button>

                        {isScheduleSaved && <p className="mt-2 text-green-600">Agendamento salvo com sucesso!</p>}
                    </div>
                </MyModal>


                <AlertModal
                    isOpen={alertIsOpen}
                    onRequestClose={() => setAlertIsOpen(false)}
                    title={alertTitle}
                    message={alertMessage}
                    showOkButton={!alertLoading}
                    loading={alertLoading}
                />
            </div>
        </div>
    );
};

export default MarketingMp3;
