'use client'

import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import loadAvatar from '@/utils/load-avatar';

import Input from '@/common/shared/input/Input'
import Button from '@/common/shared/button/Button'
import T from '@/common/shared/i18n/T'

import { registration } from '@/store/auth/auth-operations'
import avatar from '../../../../public/images/avatar.png';
import { FaPlay, FaGoogle } from 'react-icons/fa'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_SERVER_API_URL

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: 'demo@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    },
  })

  const onSubmit = async (data) => {
    try {
      const base64Avatar = await loadAvatar(avatar.src)

      const payload = {
        name: data.name?.trim() || '',
        email: data.email,
        password: data.password,
        userAvatar: base64Avatar,
      }

      await dispatch(registration(payload)).unwrap()

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
          <T caseMode="sentence">Create account</T>
        </h1>

        <p className="auth-card__subtitle">
          <T caseMode="sentence">Start sharing your videos today</T>
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
          label={<T caseMode="sentence">Name (optional)</T>}
          type="text"
          autoComplete="name"
          {...register('name', {
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
          })}
          error={errors.name?.message}
        />

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
          autoComplete="new-password"
          hint={<T caseMode="sentence">At least 6 characters</T>}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
          error={errors.password?.message}
        />

        <Input
          label={<T caseMode="sentence">Confirm password</T>}
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) =>
              value === getValues('password') || 'Passwords do not match',
          })}
          error={errors.confirmPassword?.message}
        />

        <Button type="submit" variant="primary" fullWidth height="40px" disabled={isSubmitting}>
          <T caseMode="sentence">Create account</T>
        </Button>
      </form>

      <div className="auth-card__footer">
        <T caseMode="sentence">Already have an account?</T>{' '}
        <Link href="/auth/login">
          <T caseMode="sentence">Sign in</T>
        </Link>
      </div>
    </div>
  )
}
