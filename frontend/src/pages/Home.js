import { Link } from 'react-router-dom';

function Home(){

    return(
        <div className='min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center'>

            <h1 className='text-6xl font-bold mb-5'>PayBack Buddy</h1>

            <p className='text-xl text-gray-300 mb-8'>
                Recover your money without awkward conversations.
            </p>

            <div className='flex gap-5'>

                <Link to='/login'>
                    <button className='bg-green-500 px-6 py-3 rounded-xl text-lg'>
                        Login
                    </button>
                </Link>

                <Link to='/register'>
                    <button className='bg-blue-500 px-6 py-3 rounded-xl text-lg'>
                        Register
                    </button>
                </Link>

            </div>

        </div>
    )
}

export default Home;