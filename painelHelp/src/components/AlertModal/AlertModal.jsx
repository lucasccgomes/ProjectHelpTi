import React from 'react';
import Modal from 'react-modal';
import { useTransition, animated } from '@react-spring/web';
import { IoClose } from "react-icons/io5";

const AlertModal = ({ isOpen, onRequestClose, title, message, showOkButton = true, loading = false }) => {
    const transitions = useTransition(isOpen, {
        from: { opacity: 0, transform: 'translateY(-50%)' },
        enter: { opacity: 1, transform: 'translateY(0%)' },
        leave: { opacity: 0, transform: 'translateY(-50%)' },
    });

    return transitions(
        (styles, item) =>
            item && (
                <Modal
                    isOpen={isOpen}
                    onRequestClose={onRequestClose}
                    className="modal"
                    overlayClassName="overlay"
                    style={{
                        overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
                        content: { transition: 'opacity 0.3s ease-in-out' },
                    }}
                >
                    <animated.div style={styles}>

                        <div className='p-4 bg-white border border-gray-300 rounded-xl shadow-lg '>
                            <div className='flex justify-between mb-1'>
                                <h2 className="text-xl font-bold mb-4">{title}</h2>
                                <button
                                    onClick={onRequestClose}
                                    className='bg-red-600 text-white p-2 rounded-full h-7 w-7 flex justify-center items-center shadow-xl'
                                >
                                    <IoClose className='' />
                                </button>
                            </div>
                            <p>{message}</p>
                            {showOkButton && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={onRequestClose}
                                        className="bg-green-500 text-white p-2 rounded hover:bg-green-600 focus:outline-none focus:ring focus:ring-green-200"
                                    >
                                        OK
                                    </button>
                                </div>
                            )}
                            {loading && (
                                <div className="mt-4 text-blue-500">Enviando solicitação...</div>
                            )}
                        </div>
                    </animated.div>
                </Modal>
            )
    );
};

export default AlertModal;
