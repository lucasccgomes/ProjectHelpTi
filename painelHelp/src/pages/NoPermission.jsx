// NoPermission.jsx
import React from 'react';
import { MdOutlineDoNotDisturb } from "react-icons/md";

const NoPermission = () => {
    return (
        <div className='flex justify-center w-full items-center h-screen pt-20 bg-altBlue text-white'>
            <div className='flex justify-center flex-col items-center'>
                <MdOutlineDoNotDisturb className='text-5xl' />
                <h1 className='lg:text-2xl text-center'>Seu usuário não tem autorização para esta tela.</h1>
            </div>
        </div>
    );
};

export default NoPermission;
