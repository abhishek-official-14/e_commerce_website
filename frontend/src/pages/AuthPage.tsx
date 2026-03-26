import { FormEvent, useState } from 'react';
import { login, register } from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../hooks/redux';

export const AuthPage = () => {
  const dispatch = useAppDispatch();
  const { loading, error, user } = useAppSelector((state) => state.auth);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLogin) {
      void dispatch(login({ email, password }));
      return;
    }

    void dispatch(register({ name, email, password }));
  };

  return (
    <section className="container-page">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">{isLogin ? 'Login' : 'Register'}</h2>
        <p className="mt-1 text-sm text-slate-500">Access your account to manage cart and orders.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {user && <p className="text-sm text-green-600">Welcome, {user.name}!</p>}

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <button className="mt-4 text-sm font-semibold text-brand-600" onClick={() => setIsLogin((current) => !current)}>
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </div>
    </section>
  );
};
