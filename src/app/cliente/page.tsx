'use client'

import 'bootstrap/dist/css/bootstrap.min.css'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useContext } from 'react'
import { guard } from '../../../components/Guard'
import NavbarComp from '../../../components/Navbar'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { IMaskInput } from 'react-imask'
import Validator from 'validatorjs'
import toast, { Toaster } from 'react-hot-toast'
import { ToastVariant, ToastColor } from '../../../components/ToastColors'
import Loading from '../../../components/Loading'
import { UserContext } from '../../../context/UserContext'
import { ApiContext } from '../../../context/ApiContext'
import Footer from '../../../components/Footer'

function cliente() {
  const router = useRouter()
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT)
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT)
  const [loading, setLoading] = useState(false)
  const [loadingStyle, setLoadingStyle] = useState('')

  const { getPersistAuth } = useContext(UserContext)
  const {getJwt, apiKey} = useContext(ApiContext);
  const config = {
    headers:{
      "Authorization": "Bearer "+getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }
  guard()

  const [fulluser, setFulluser]: any = useState(getPersistAuth())

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string) {
    setToastVariant(toastVariant)
    setToastColor(toastColor)
    toast(message)
  }

  const navbarperms = [
    {
      title: 'Cliente',
      opts: [
        { label: 'Cadastrar', url: '/cliente' },
        { label: 'Buscar', url: '/cliente/buscar' },
      ],
    },
    {
      title: 'Veículo',
      opts: [
        { label: 'Cadastrar', url: '/veiculo' },
        { label: 'Buscar', url: '/veiculo/buscar' },
      ],
    },
    {
      title: 'Serviço',
      opts: [
        { label: 'Cadastrar', url: '/servico' },
        { label: 'Buscar', url: '/servico/buscar' },
      ],
    },
  ]

  const colMd4 = `col-lg-2 col-md-6 col-6 mt-5 pt-2 d-flex align-items-center justify-content-center`

  const [cpfcnpj, setCpfcnpj] = useState('')
  const [nome, setNome] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneIsWhatsapp, setPhoneIsWhatsapp] = useState(false)
  const [email, setEmail] = useState('')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [validated, setValidated] = useState(false)
  const [disableSubmitButtonFormState, setDisableSubmitButtonFormState] = useState(true)

  const [labelData, setLabelData] = useState("Data de nascimento")

  const handleCep = (cep: string) => {
    setCep(cep)

    if (cep.length === 9) {
      cep = cep.replace(/[^0-9]/g, '')
      getAddressByCep(cep)
    }
  }

  const getAddressByCep = async (cep: string) => {
    axios
      .get(`https://viacep.com.br/ws/${cep}/json/`)
      .then((res: any) => {
        if (res.data.erro) {
          setLogradouro('')
          setCep('')
          showToast(ToastVariant.ERROR, ToastColor.LIGHT, 'CEP inválido')
          return
        }

        setLogradouro(`${res.data.logradouro}, ${res.data.bairro}, ${res.data.localidade}-${res.data.uf}`)
      })
      .catch((err: any) => {
        const payload = {
          username: 'Autosys Web',
          content: '**Erro ao buscar CEP**\n```js\n' + JSON.stringify(err) + '\n```',
        }
        axios.post(process.env.DISCORD_WEBHOOK!, payload)
      })
  }

  const validateClient = (document: string) => {
    axios.post(process.env.CLIENT_SEARCH!, { document: document }, config)
      .then(res => {
        if (res.data.result.length > 0) {
          showToast(ToastVariant.WARNING, ToastColor.DARK, 'Usuário já cadastrado');
          setDisableSubmitButtonFormState(true);
        } else {
          setDisableSubmitButtonFormState(false);
        }
      })
  }

  const registerClient = (event: any) => {
    const form = event.currentTarget
    event.preventDefault()

    setLoading(true)
    if (form.checkValidity() === false) {
      event.stopPropagation()
      setLoading(false)
      setValidated(true)
      return
    }

    const document = cpfcnpj.replace(/\D/g, '')
    const cepOnlyNumbers = cep.replace(/\D/g, '')

    const infos = {
      document: document,
      name: nome,
      birthday: new Date(birthdate).toISOString(),
      phone: phone,
      phoneIsWhatsapp: phoneIsWhatsapp,
      email: email,
      address: complemento ? { zipcode: cepOnlyNumbers, place: logradouro, number: numero } : { zipcode: cepOnlyNumbers, place: logradouro, number: numero, complement: complemento },
      createdBy: fulluser.username,
      companyId: fulluser.companyId,
    }

    let rules = {
      document: "",
      address: {
        zipcode: "digits:8",
      }
    }

    if (document.length > 11) {
      rules.document = "digits:14"
    } else {
      rules.document = "digits:11"
    }

    const validation = new Validator(infos, rules)

    if (validation.fails()) {
      let message = ''

      if (validation.errors.get('document').length > 0) {
        message = 'O documento só pode ser um CPF ou um CNPJ'

      } else if (validation.errors.get('cep').length > 0) {
        message = 'Tamanho mínimo do CEP: 8 dígitos'
      }
      setLoading(false)

      showToast(ToastVariant.ERROR, ToastColor.LIGHT, message)
      return
    }

    const clientInfosSearch = {
      document: document,
      active: true,
      companyId: fulluser.companyId,
    }

    axios
      .post(process.env.CLIENT_SEARCH!, clientInfosSearch, config)
      .then((res) => {
        if (res.data.result.length > 0) {
          setLoading(false)
          showToast(ToastVariant.ERROR, ToastColor.LIGHT, 'O cliente já está cadastrado')
          return
        }

        axios
          .post(process.env.CLIENT!, infos, config)
          .then(() => {
            setLoading(false)
            showToast(ToastVariant.SUCCESS, ToastColor.DARK, 'Cliente criado com sucesso!')

            setCpfcnpj('')
            setNome('')
            setBirthdate('')
            setPhone('')
            setPhoneIsWhatsapp(false)
            setEmail('')
            setCep('')
            setLogradouro('')
            setNumero('')
            setComplemento('')
            setValidated(false)
          })
          .catch((err) => {
            setLoading(false)
            const payload = {
              username: 'Autosys Web',
              content: '**Erro ao cadastrar cliente**\n```js\n' + JSON.stringify(err) + '\n```',
            }

            axios.post(process.env.DISCORD_WEBHOOK!, payload)
          })
      })
      .catch((err) => {
        setLoading(false)
        const payload = {
          username: 'Autosys Web',
          content: '**Erro ao buscar cliente**\n```js\n' + JSON.stringify(err) + '\n```',
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload)
      })
  }

  let toastOptions = {
    className: '',
    duration: Number(process.env.TOAST_TIME!),
    style: {
      background: toastVariant,
      color: toastColor,
    },
  }

  return (
    <>
      {loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ''}

      <div className={loading ? loadingStyle : ''}>
        <NavbarComp perms={navbarperms} />
        <h1 className='text-center mt-5'>Cadastro de cliente</h1>

        <div className='w-100 d-flex justify-content-center'>
          <Toaster toastOptions={toastOptions} />
        </div>

        <Form className='container mt-5' onSubmit={registerClient} noValidate validated={validated}>
          <div className='row'>
            <div className='col-md-6'>
              <Form.Label>
                <b>CPF ou CNPJ:</b>
              </Form.Label>
              <Form.Control
                required
                as={IMaskInput}
                mask={[{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }]}
                value={cpfcnpj}
                onBlur={(e) => {
                  const valor = e.target.value.replace(/\D/g, '');
                  validateClient(valor)

                  if(valor.length < 14){
                    setLabelData("Data de nascimento")
                    setCpfcnpj(e.target.value)
                    return;
                  }
                  else if(valor.split("").length > 11){
                    setLabelData("Data de abertura")
                    validateClient(valor)
                  }

                  setCpfcnpj(e.target.value)
                  return;
                }}

                onChange={(e) => {
                  const valor = e.target.value.replace(/\D/g, '');
                  validateClient(valor)

                  if(valor.length < 14){
                    setLabelData("Data de nascimento")
                    setCpfcnpj(e.target.value)
                  }
                  else if(valor.split("").length > 11){
                    setLabelData("Data de abertura")
                    validateClient(valor)
                  }

                  setCpfcnpj(e.target.value)
                  return;
                }}
                placeholder='CPF ou CNPJ'
              />
              <Form.Control.Feedback type='invalid'>Campo obrigatório</Form.Control.Feedback>
            </div>
            <div className='col-md-6'>
              <Form.Label>
                <b>Nome:</b>
              </Form.Label>
              <Form.Control
                required
                value={nome}
                maxLength={70}
                onChange={(e) => {
                  setNome(e.target.value)
                }}
                placeholder='Nome'
              />
              <Form.Control.Feedback type='invalid'>Campo obrigatório</Form.Control.Feedback>
            </div>
          </div>

          <div className='row mt-3'>
            <div className='col-lg-3 mt-4 col-md-6 col-6'>
              <Form.Label>
                <b>{labelData}:</b>
              </Form.Label>
              <Form.Control
                required
                value={birthdate}
                type='date'
                onChange={(e) => {
                  setBirthdate(e.target.value)
                }}
                placeholder='yyyy/mm/dd'
              />
              <Form.Control.Feedback type='invalid'>Campo obrigatório</Form.Control.Feedback>
            </div>
            <div className="col-lg-4 mt-4 col-md-6 col-6">
              <Form.Label>
                <b>Email: (opcional)</b>
              </Form.Label>
              <Form.Control
                value={email}
                maxLength={70}
                onChange={(e) => {
                  setEmail(e.target.value)
                }}
                placeholder='Email'
                type='email'
              />
            </div>
            <div className='col-lg-3 mt-4 col-md-6 col-6'>
              <Form.Label>
                <b>Telefone:</b>
              </Form.Label>
              <Form.Control
                required
                value={phone}
                as={IMaskInput}
                mask={["(00)00000-0000"]}

                onBlur={(e) => {
                  setPhone(e.target.value)
                }}
                onChange={(e) => {
                  setPhone(e.target.value)
                }}
                placeholder='Telefone'
              />
              <Form.Control.Feedback type='invalid'>Campo obrigatório</Form.Control.Feedback>
            </div>
            <div className={colMd4}>
              <Form.Check // prettier-ignore
                type='checkbox'
                checked={phoneIsWhatsapp}
                onChange={(e) => {
                  setPhoneIsWhatsapp(e.target.checked)
                }}
                id='default-checkbox'
                label='Whatsapp'
              />
            </div>
          </div>

          <div className='row mt-5'>
            <div className='col-md-6'>
              <Form.Label>
                <b>CEP:</b>
              </Form.Label>
              <Form.Control
                required
                value={cep}
                as={IMaskInput}
                mask='00000-000'
                onChange={(e) => {
                  handleCep(e.target.value)
                }}
                placeholder='CEP'
              />
              <Form.Control.Feedback type='invalid'>Campo obrigatório</Form.Control.Feedback>
            </div>

            <div className='col-md-6'>
              <Form.Label>
                <b>Logradouro:</b>
              </Form.Label>
              <Form.Control
                required
                disabled
                value={logradouro}
                onChange={(e) => {
                  setLogradouro(e.target.value)
                }}
              />
              <Form.Control.Feedback type='invalid'>Campo obrigatório</Form.Control.Feedback>
            </div>
          </div>

          <div className='row mt-5 mb-5'>
            <div className='col-md-6'>
              <Form.Label>
                <b>Número:</b>
              </Form.Label>
              <Form.Control
                required
                value={numero}
                type='number'
                min={0}
                step={1}
                onKeyDown={(evt) => ['e', 'E', '+', '-'].includes(evt.key) && evt.preventDefault()}
                onChange={(e) => {
                  setNumero(e.target.value)
                }}
                placeholder='Número'
              />
              <Form.Control.Feedback type='invalid'>Campo obrigatório</Form.Control.Feedback>
            </div>

            <div className='col-md-6'>
              <Form.Label>
                <b>Complemento: (opcional)</b>
              </Form.Label>
              <Form.Control
                value={complemento}
                maxLength={50}
                onChange={(e) => {
                  setComplemento(e.target.value)
                }}
                placeholder='Complemento'
              />
            </div>
          </div>

          <div className='mb-2 text-center'>
            <Button
              onClick={() => {
                setLoading(true)
                router.push('/home')
              }}
              variant='secondary'
            >
              Cancelar
            </Button>{' '}
            <Button variant='primary' type='submit' disabled={disableSubmitButtonFormState}>
              Salvar
            </Button>
          </div>
        </Form>
      </div>
    </>
  )
}

export default cliente
