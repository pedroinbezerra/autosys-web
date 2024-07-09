"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useRouter } from 'next/navigation'
import { useState, useEffect, useContext } from "react";
import { guard } from "../../../components/Guard";
import NavbarComp from "../../../components/Navbar";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { IMaskInput } from "react-imask";
import Validator from 'validatorjs';
import toast, { Toaster } from 'react-hot-toast';
import { ToastVariant, ToastColor } from '../../../components/ToastColors';
import Loading from '../../../components/Loading';
import { UserContext } from "../../../context/UserContext";
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { setCompany } from "../../../context/CompanyContext";
import { ApiContext } from "../../../context/ApiContext";
import Footer from "../../../components/Footer";

function cliente() {
  interface Item {
    name: string;
    _id: string;
    document: string;
    image: string;
  }

  const router = useRouter();
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);
  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<Item[]>([]);
  const [clientCompany, setClientCompany] = useState([]);

  const { getPersistAuth } = useContext(UserContext);
  const { getJwt, apiKey } = useContext(ApiContext);
  const config = {
    headers: {
      "Authorization": "Bearer " + getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }
  guard();

  const [fulluser, setFulluser]: any = useState(getPersistAuth());

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string) {
    setToastVariant(toastVariant);
    setToastColor(toastColor);
    toast(message);
  }

  const navbarperms = [
    {
      title: "Cliente",
      opts: [
        { label: "Cadastrar", url: "/cliente" },
        { label: "Buscar", url: "/cliente/buscar" },
      ]
    },
    {
      title: "Veículo",
      opts: [
        { label: "Cadastrar", url: "/veiculo" },
        { label: "Buscar", url: "/veiculo/buscar" },
      ]
    },
    {
      title: "Serviço",
      opts: [
        { label: "Cadastrar", url: "/servico" },
        { label: "Buscar", url: "/servico/buscar" },
      ]
    }
  ];
  const colMd4 = `col-md-4 mt-4 pt-2 d-flex align-items-center`;

  const [cpfcnpj, setCpfcnpj] = useState('');
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneIsWhatsapp, setPhoneIsWhatsapp] = useState(false);
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [validated, setValidated] = useState(false);

  const registerClient = (event: any) => {
    const form = event.currentTarget;
    event.preventDefault();

    setLoading(true);
    if (form.checkValidity() === false) {
      event.stopPropagation();
      setLoading(false);
      setValidated(true);
      return;
    }

    const document = cpfcnpj.replace(/\D/g, '');
    const cepOnlyNumbers = cep.replace(/\D/g, '');

    const infos = {
      document: document,
      name: nome,
      birthday: new Date(birthdate).toISOString(),
      phone: phone,
      phoneIsWhatsapp: phoneIsWhatsapp,
      email: email,
      cep: cepOnlyNumbers,
      address: complemento ? `${logradouro}, ${numero}, ${complemento}` : `${logradouro}, ${numero}`,
      createdBy: fulluser.username,
      companyId: fulluser.companyId
    };

    const rules = {
      document: "digits:11",
      cep: "digits:8",
    }

    const validation = new Validator(infos, rules);

    if (validation.fails()) {
      let message = '';

      if (validation.errors.get('document').length > 0) {
        message = 'Tamanho mínimo do documento: 11 dígitos';
      }

      else if (validation.errors.get('cep').length > 0) {
        message = 'Tamanho mínimo do CEP: 8 dígitos';
      }
      setLoading(false);

      showToast(ToastVariant.ERROR, ToastColor.LIGHT, message);
      return;
    }

    const clientInfosSearch = {
      "document": document,
      "active": true,
      "companyId": fulluser.companyId,
    }

    axios.post(process.env.CLIENT_SEARCH!, clientInfosSearch, config).then((res) => {
      if (res.data.result.length > 0) {
        setLoading(false);
        showToast(ToastVariant.ERROR, ToastColor.LIGHT, "O cliente já está cadastrado");
        return;
      }

      axios.post(process.env.CLIENT!, infos, config).then(() => {
        setLoading(false);
        showToast(ToastVariant.SUCCESS, ToastColor.DARK, "Cliente criado com sucesso!");

        setCpfcnpj('');
        setUsername('');
        setNome('');
        setBirthdate('');
        setPhone('');
        setPhoneIsWhatsapp(false);
        setEmail('');
        setCep('');
        setLogradouro('');
        setNumero('');
        setComplemento('');
        setClientCompany([])
        setValidated(false);
      }).catch((res) => {
        setLoading(false);
        const payload = {
          username: "Autosys Web",
          content: '**Erro ao cadastrar cliente**\n**Payload:**\n```js\n' + JSON.stringify(infos) + '\n```**Erro:**\n```js\n' + JSON.stringify(res) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      });

    }).catch((res) => {
      setLoading(false);
      const payload = {
        username: "Autosys Web",
        content: '**Erro ao buscar cliente**\n**Payload:**\n```js\n' + JSON.stringify(clientInfosSearch) + '\n```**Erro:**\n```js\n' + JSON.stringify(res) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });
  }

  let toastOptions = {
    className: '',
    duration: Number(process.env.TOAST_TIME!),
    style: {
      background: toastVariant,
      color: toastColor,
    }
  }

  const handleSearchCompany = (query: string) => {
    setIsLoading(true);

    axios.post(`${process.env.COMPANY}find`, {}, config)
      .then((items) => {
        setOptions(items.data.result);
        setIsLoading(false);
      });
  };

  const filterBy = () => true;

  return (
    <>
      {loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ''}

      <div className={loading ? loadingStyle : ''} >
        <NavbarComp perms={navbarperms} />
        <h1 className="text-center mt-5">Cadastro de usuário</h1>

        <div className="w-100 d-flex justify-content-center">
          <Toaster toastOptions={toastOptions} />
        </div>

        <Form className="container mt-5" onSubmit={registerClient} noValidate validated={validated}>
          <div className="row">
            <div className="col-md-6">
              <Form.Label><b>CPF ou CNPJ:</b></Form.Label>
              <Form.Control required as={IMaskInput} mask="000.000.000-00" value={cpfcnpj} onChange={(e) => { setCpfcnpj(e.target.value) }} placeholder="CPF ou CNPJ" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
            <div className="col-md-6">
              <Form.Label><b>Nome:</b></Form.Label>
              <Form.Control required value={nome} onChange={(e) => { setNome(e.target.value) }} placeholder="Nome" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
          </div>

          <div className="row mt-5">
            <div className="col-md-4">
              <Form.Label><b>Nome de usuário:</b></Form.Label>
              <Form.Control required value={username} type="text" onChange={(e) => { setUsername(e.target.value) }} placeholder="Nome de usuário" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
            <div className="col-md-8">
              <Form.Label><b>Empresa</b></Form.Label>
              <AsyncTypeahead
                filterBy={filterBy}
                id="async-company-search"
                isLoading={isLoading}
                multiple
                labelKey={(options: any) => `${options.name} - ${options.document}`}
                options={options}
                minLength={3}
                onSearch={handleSearchCompany}
                placeholder="Empresa"
                onChange={setCompany}
                emptyLabel="Nenhuma empresa encontrada"
                renderMenuItemChildren={(option: any) => (
                  <>
                    <img
                      alt={option.name}
                      src={option.image || '/profile-logo.png'}
                      style={{
                        height: '24px',
                        marginRight: '10px',
                        width: '24px',
                      }}
                    />
                    <span>{option.name}</span>
                  </>
                )}
              />
            </div>
          </div>

          <div className="row mt-5">
            <div className="col-md-4">
              <Form.Label><b>Data de nascimento:</b></Form.Label>
              <Form.Control required value={birthdate} type="date" onChange={(e) => { setBirthdate(e.target.value) }} placeholder="yyyy/mm/dd" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
            <div className="col-md-4">
              <Form.Label><b>Telefone:</b></Form.Label>
              <Form.Control required value={phone} as={IMaskInput} mask="(00)00000-0000" onChange={(e) => { setPhone(e.target.value) }} placeholder="Telefone" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
            <div className={colMd4}>
              <Form.Check // prettier-ignore
                type='checkbox'
                checked={phoneIsWhatsapp}
                onChange={(e) => { setPhoneIsWhatsapp(e.target.checked) }}
                id='default-checkbox'
                label='Telefone é Whatsapp'
              />
            </div>
          </div>

          <div className="row mt-5">
            <div className="col-md-12">
              <Form.Label><b>Email:</b></Form.Label>
              <Form.Control value={email} onChange={(e) => { setEmail(e.target.value) }} placeholder="Email" type="email" />
            </div>
          </div>

          <div className="row mt-5">
            <div className="col-md-6">
              <Form.Label><b>CEP:</b></Form.Label>
              <Form.Control required value={cep} as={IMaskInput} mask="00000-000" onChange={(e) => { setCep(e.target.value) }} placeholder="CEP" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>

            <div className="col-md-6">
              <Form.Label><b>Logradouro:</b></Form.Label>
              <Form.Control required value={logradouro} onChange={(e) => { setLogradouro(e.target.value) }} placeholder="Logradouro" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
          </div>

          <div className="row mt-5 mb-5">
            <div className="col-md-6">
              <Form.Label><b>Número:</b></Form.Label>
              <Form.Control required value={numero} type="number" onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()} onChange={(e) => { setNumero(e.target.value) }} placeholder="Número" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>

            <div className="col-md-6">
              <Form.Label><b>Complemento:</b></Form.Label>
              <Form.Control value={complemento} onChange={(e) => { setComplemento(e.target.value) }} placeholder="Complemento" />
            </div>
          </div>

          <div className="mb-2 text-center">
            <Button onClick={() => { setLoading(true); router.push("/home") }} variant="secondary">
              Cancelar
            </Button>{' '}
            <Button variant="primary" type="submit">
              Salvar
            </Button>
          </div>
        </Form >
      </div>
    </>
  );
}

export default cliente;