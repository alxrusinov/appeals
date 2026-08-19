import { Link } from "react-router-dom";
import { RegisterForm } from "../features/auth/components/RegisterForm";

export const RegisterPage = () => {
    return (
        <div className="min-h-screen w-full flex bg-gray-50 font-sans antialiased">

            {/* Левая панель: Презентационный блок (скрыт на мобильных, виден от md и выше) */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-800 to-emerald-950 flex-col justify-between p-12 text-white relative overflow-hidden">

                <div className="absolute -top-40 -left-40 w-96 h-96 bg-green-600/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-3 z-10">
                    <i className="pi pi-building text-3xl text-green-400" />
                    <span className="text-xl font-black tracking-wider uppercase">Система ЖКХ</span>
                </div>

                <div className="max-w-md my-auto z-10 animate-fadein">
                    <h2 className="text-4xl font-extrabold leading-tight tracking-tight mb-4">
                        Подавайте обращения через личный кабинет
                    </h2>
                    <p className="text-green-100/80 text-lg leading-relaxed">
                        Регистрация занимает меньше минуты. После входа вы сможете отслеживать статус
                        каждого своего обращения и получать ответы ведомств онлайн.
                    </p>
                </div>

                <div className="text-sm text-green-300/60 z-10">
                    Дипломный проект • СибГУТИ • 2026
                </div>
            </div>

            {/* Правая панель: Форма регистрации */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl md:shadow-lg md:border md:border-gray-100 animate-fadein">

                    <div className="flex md:hidden items-center gap-2 justify-center text-green-700 mb-8">
                        <i className="pi pi-building text-3xl font-bold" />
                        <span className="text-xl font-black uppercase tracking-wider">Система ЖКХ</span>
                    </div>

                    <div className="mb-6 text-center md:text-left">
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Регистрация гражданина
                        </h3>
                        <p className="text-gray-500 mt-1 text-sm">
                            Создайте аккаунт, чтобы подавать обращения онлайн
                        </p>
                    </div>

                    <RegisterForm />

                    <p className="text-sm text-gray-500 mt-6 text-center md:text-left">
                        Уже есть аккаунт?{" "}
                        <Link to="/login" className="text-green-700 font-semibold hover:underline">
                            Войти
                        </Link>
                    </p>
                </div>
            </div>

        </div>
    );
};
