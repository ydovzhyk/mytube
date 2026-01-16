'use client'

import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { login } from '@/store/auth/auth-operations'

import Input from '@/common/shared/input/Input'
import Button from '@/common/shared/button/Button'
import T from '@/common/shared/i18n/T'

import { FaPlay, FaGoogle } from 'react-icons/fa'
export default function LoginPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_SERVER_API_URL

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      email: 'demo@example.com',
      password: 'password123',
    },
  })

  const onSubmit = async (data) => {
    try {
      const payload = {
        email: data.email,
        password: data.password,
      }

      await dispatch(login(payload)).unwrap()

      reset()
      router.push('/')
    } catch (err) {
      //no op
    }
  }

  const onGoogleClick = (e) => {
    e.preventDefault()
    if (!API_URL) return
    const origin = encodeURIComponent(window.location.origin)
    window.location.href = `${API_URL}/api/google?origin=${origin}`
  }

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <div className="auth-card__logo">
          <FaPlay />
          <span>MyTube</span>
        </div>

        <h1 className="auth-card__title">
          <T caseMode="sentence">Welcome back</T>
        </h1>

        <p className="auth-card__subtitle">
          <T caseMode="sentence">Sign in to your account</T>
        </p>
      </div>

      {API_URL ? (
        <div className="auth-card__oauth">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            height="40px"
            leftIcon={<FaGoogle size={18} />}
            onClick={onGoogleClick}
          >
            <T caseMode="sentence">Continue with Google</T>
          </Button>

          <div className="auth-card__divider">
            <span>
              <T caseMode="sentence">or</T>
            </span>
          </div>
        </div>
      ) : null}

      <form className="auth-card__form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label={<T caseMode="sentence">Email</T>}
          type="email"
          autoComplete="email"
          inputMode="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email',
            },
          })}
          error={errors.email?.message}
        />

        <Input
          label={<T caseMode="sentence">Password</T>}
          type="password"
          autoComplete="current-password"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
          error={errors.password?.message}
        />

        <Button type="submit" variant="primary" fullWidth height="40px" disabled={isSubmitting}>
          <T caseMode="sentence">Sign in</T>
        </Button>
      </form>

      <div className="auth-card__footer">
        <T caseMode="sentence">Don&apos;t have an account?</T>{' '}
        <Link href="/auth/register">
          <T caseMode="sentence">Sign up</T>
        </Link>
      </div>
    </div>
  )
}
