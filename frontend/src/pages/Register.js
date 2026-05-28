import { useState } from 'react';
import axios from 'axios';

function Register(){

    const [form, setForm] = useState({
        name:'',
        email:'',
        password:''
    });

    const submitHandler = async(e) => {
        e.preventDefault();

        const res = await axios.post(
            'http://localhost:8080/payback/backend/api/register.php',
            form
        );

        alert(res.data.message);
    }

    return(
        <div className='min-h-screen flex justify-center items-center bg-slate-900'>

            <form
                onSubmit={submitHandler}
                className='bg-white p-10 rounded-2xl w-96'
            >

                <h1 className='text-3xl font-bold mb-5 text-center'>
                    Register
                </h1>

                <input
                    type='text'
                    placeholder='Name'
                    className='w-full border p-3 mb-4'
                    onChange={(e)=>setForm({...form,name:e.target.value})}
                />

                <input
                    type='email'
                    placeholder='Email'
                    className='w-full border p-3 mb-4'
                    onChange={(e)=>setForm({...form,email:e.target.value})}
                />

                <input
                    type='password'
                    placeholder='Password'
                    className='w-full border p-3 mb-4'
                    onChange={(e)=>setForm({...form,password:e.target.value})}
                />

                <button className='bg-blue-500 text-white w-full py-3 rounded-xl'>
                    Register
                </button>

            </form>

        </div>
    )
}

export default Register;