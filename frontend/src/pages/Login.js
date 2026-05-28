import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login(){

    const navigate = useNavigate();

    const [form, setForm] = useState({
        email:'',
        password:''
    });

    const submitHandler = async(e) => {

        e.preventDefault();

        try{

            const res = await axios.post(
                'http://localhost:8080/payback/backend/api/login.php',
                form,
                {
                    headers:{
                        'Content-Type':'application/json'
                    }
                }
            );

            if(res.data.success){

                alert(res.data.message);

                navigate('/dashboard');

            }else{

                alert(res.data.message);
            }

        }catch(error){

            console.log(error);

            alert("Login Failed");
        }
    }

    return(
        <div className='min-h-screen flex justify-center items-center bg-slate-900'>

            <form
                onSubmit={submitHandler}
                className='bg-white p-10 rounded-2xl w-96'
            >

                <h1 className='text-3xl font-bold mb-5 text-center'>
                    Login
                </h1>

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

                <button className='bg-green-500 text-white w-full py-3 rounded-xl'>
                    Login
                </button>

            </form>

        </div>
    )
}

export default Login;