import { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard(){

    const [loans, setLoans] = useState([]);

    const [form, setForm] = useState({
        lender_name:'',
        borrower_name:'',
        borrower_email:'',
        amount:'',
        reason:'',
        due_date:''
    });

    useEffect(()=>{
        fetchLoans();
    },[])

    const fetchLoans = async() => {

        const res = await axios.get(
            'http://localhost:8080/payback/backend/api/getLoans.php'
        );

        setLoans(res.data);
    }

    const submitHandler = async(e) => {

        e.preventDefault();

        const res = await axios.post(
            'http://localhost:8080/payback/backend/api/addLoan.php',
            form
        );

        alert(res.data.message);

        fetchLoans();
    }

    const sendReminder = async(id) => {

        const reminder = {
            loan_id:id,
            message:'Hey friend 😊 This is a gentle reminder to return the borrowed money.'
        }

        const res = await axios.post(
            'http://localhost:8080/payback/backend/api/sendReminder.php',
            reminder
        );

        alert(res.data.message);
    }

    const payNow = async(id) => {

        const res = await axios.post(
            'http://localhost:8080/payback/backend/api/payment.php',
            {loan_id:id}
        );

        alert(res.data.message);

        fetchLoans();
    }

    return(

        <div className='min-h-screen bg-slate-900 text-white p-10'>

            <h1 className='text-5xl font-bold mb-10'>
                Dashboard
            </h1>

            <form
                onSubmit={submitHandler}
                className='grid md:grid-cols-2 gap-5 mb-10'
            >

                <input
                    type='text'
                    placeholder='Your Name'
                    className='p-3 rounded text-black'
                    onChange={(e)=>setForm({...form,lender_name:e.target.value})}
                />

                <input
                    type='text'
                    placeholder='Borrower Name'
                    className='p-3 rounded text-black'
                    onChange={(e)=>setForm({...form,borrower_name:e.target.value})}
                />

                <input
                    type='email'
                    placeholder='Borrower Email'
                    className='p-3 rounded text-black'
                    onChange={(e)=>setForm({...form,borrower_email:e.target.value})}
                />

                <input
                    type='number'
                    placeholder='Amount'
                    className='p-3 rounded text-black'
                    onChange={(e)=>setForm({...form,amount:e.target.value})}
                />

                <input
                    type='text'
                    placeholder='Reason'
                    className='p-3 rounded text-black'
                    onChange={(e)=>setForm({...form,reason:e.target.value})}
                />

                <input
                    type='date'
                    className='p-3 rounded text-black'
                    onChange={(e)=>setForm({...form,due_date:e.target.value})}
                />

                <button className='bg-blue-500 py-3 rounded-xl col-span-2'>
                    Add Loan Request
                </button>

            </form>

            <div className='grid md:grid-cols-2 gap-5'>

                {
                    loans.map((loan)=>(

                        <div
                            key={loan.id}
                            className='bg-slate-800 p-5 rounded-2xl shadow-lg'
                        >

                            <h2 className='text-2xl font-bold mb-3'>
                                {loan.borrower_name}
                            </h2>

                            <p>Amount: ₹{loan.amount}</p>
                            <p>Reason: {loan.reason}</p>
                            <p>Due Date: {loan.due_date}</p>
                            <p>Status: {loan.status}</p>

                            <div className='flex gap-3 mt-5'>

                                <button
                                    onClick={()=>sendReminder(loan.id)}
                                    className='bg-yellow-500 px-4 py-2 rounded-lg'
                                >
                                    Send Reminder
                                </button>

                                <button
                                    onClick={()=>payNow(loan.id)}
                                    className='bg-green-500 px-4 py-2 rounded-lg'
                                >
                                    Pay Now
                                </button>

                            </div>

                        </div>
                    ))
                }

            </div>

        </div>
    )
}

export default Dashboard;