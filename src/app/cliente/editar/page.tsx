"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { useRouter } from 'next/navigation'
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import NavbarComp from "../../../../components/Navbar";
import { guard } from "../../../../components/Guard";
import { IMaskInput } from "react-imask";
import Validator from 'validatorjs';
import toast, { Toaster } from 'react-hot-toast';
import {ToastVariant, ToastColor} from '../../../../components/ToastColors';
import Loading from "../../../../components/Loading";
import { ClientContext } from '../../../../context/ClientContext';
import { UserContext } from '../../../../context/UserContext'
import { ApiContext } from "../../../../context/ApiContext";
import Footer from "../../../../components/Footer";

function cliente() {
  const router = useRouter();
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");

  const {getClient, deleteClient, setClient} = useContext(ClientContext);
  const {getPersistAuth} = useContext(UserContext);
  const {getJwt, apiKey} = useContext(ApiContext);

  const config = {
    headers:{
      "Authorization": "Bearer "+getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }

  const [fulluser, setFulluser]: any = useState(getPersistAuth());

  guard();

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

  const handleCep = (cep: string) => {
    setCep(cep)

    if (cep.length === 9) {
      cep = cep.replace(/[^0-9]/g, '')
      getAddressByCep(cep)
    }
  }

  useEffect(() => {
    setLoading(true);
    const client = getClient();
    if(!client.edit) {
      if(typeof window != "undefined") {
        router.push("/cliente/buscar")
        return;
      }
    }
    setLoading(false);
  }, [])

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string) {
    setToastVariant(toastVariant);
    setToastColor(toastColor);
    toast(message);
  }

  
  const navbarperms: any = [
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

  const [clientInfos, setClientInfos]: any = useState(getClient());
  if (typeof window !== "undefined") {
    if (!clientInfos._id) router.push("/cliente/buscar");
  }

  const colMd4 = `col-lg-2 col-md-6 col-6 mt-5 pt-2 d-flex align-items-center justify-content-center`;

  const [cpfcnpj, setCpfcnpj] = useState(clientInfos && clientInfos.document);
  const [nome, setNome] = useState(clientInfos && clientInfos.name);

  const birthdayClient = new Date(clientInfos && clientInfos.birthday);

  const [birthdate, setBirthdate] = useState(`${birthdayClient.getFullYear()}-${birthdayClient.getUTCMonth() + 1 < 10 ? "0" + (birthdayClient.getUTCMonth() + 1).toString() : birthdayClient.getUTCMonth() + 1}-${birthdayClient.getUTCDate() < 10 ? "0" + (birthdayClient.getUTCDate()).toString() : birthdayClient.getUTCDate()}`);
  const [phone, setPhone] = useState(clientInfos && clientInfos.phone);
  const [phoneIsWhatsapp, setPhoneIsWhatsapp] = useState(clientInfos && clientInfos.phoneIsWhatsapp);
  const [email, setEmail] = useState(clientInfos && clientInfos.email);
  const [cep, setCep] = useState(clientInfos && clientInfos.cep);
  const [logradouro, setLogradouro] = useState(clientInfos && clientInfos.logradouro);
  const [numero, setNumero] = useState(clientInfos && clientInfos.numero);
  const [complemento, setComplemento] = useState(clientInfos && clientInfos.complemento);
  const [validated, setValidated] = useState(false);

  const [labelData, setLabelData] = useState("Data de nascimento");

  useEffect(() => {
    if(cpfcnpj.replace(/\D/g, "").length < 14) {
      setLabelData("Data de nascimento")
      return;
    }
    setLabelData("Data de abertura")
  }, [cpfcnpj])

  async function updateClientInfos(event: any) {
    const form = event.currentTarget;
    event.preventDefault();

    setLoading(true);
    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      setLoading(false);
      return;
    }
    
    const document = cpfcnpj.replace(/\D/g, "");
    const cepOnlyNumbers = cep.replace(/\D/g, "");

    const infos = {
      _id: clientInfos._id,
      document: document,
      name: nome,
      birthday: new Date(birthdate).toISOString(),
      phone: phone,
      phoneIsWhatsapp: phoneIsWhatsapp,
      email: email,
      address: {zipcode: cepOnlyNumbers, place: logradouro, number: numero, complement: complemento || ""},
      updatedBy: fulluser.username,
      companyId: fulluser.companyId,
    }

    let rules = {
      document: "",
      address: {
        zipcode: "digits:8",
      }
    }

    if(document.length > 11) {
      rules.document = "digits:14"
    } else {
      rules.document = "digits:11"
    }

    const validation = new Validator(infos, rules);

    if(validation.fails()) {
      let message = '';

      if (validation.errors.get('document').length > 0) {
        message = 'O documento só pode ser um CPF ou um CNPJ';
      }

      else if (validation.errors.get('cep').length > 0) {
        message = 'Tamanho mínimo do CEP: 8 dígitos';
      }

      setLoading(false);
      showToast(ToastVariant.ERROR, ToastColor.LIGHT, message);
      return;
    }

    await axios.patch(process.env.CLIENT!, infos, config).then().catch((err) => {
      setLoading(false);
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao atualizar as informações do cliente.*\n```js\n' +JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });

    if (typeof window !== "undefined") {
      await axios.post(process.env.CLIENT_SEARCH!, { _id: infos._id, active: true, companyId: fulluser.companyId}, config ).then((res) => {
        const newClientInfos: any = res.data.result[0];

        Object.assign(newClientInfos, {cep: newClientInfos.address.zipcode, logradouro: newClientInfos.address.place, numero: newClientInfos.address.number, complemento: newClientInfos.address.complement})
        
        setLoading(false);
        showToast(ToastVariant.SUCCESS, ToastColor.DARK, "Cliente editado com sucesso!");
        setValidated(false);
        setClient(newClientInfos);
      }).catch((err) => {
        setLoading(false);
        const payload = {
          username: "Autosys Web",
          content: '*Erro ao buscar um cliente.*\n```js\n' +JSON.stringify(err) + '\n```'
        }
  
        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      });
    }
  }

  function cancel() {
    setLoading(true);
    deleteClient();
    router.push("/cliente/buscar");
  }

  let toastOptions = {
    className: '',
    duration: Number(process.env.TOAST_TIME!),
    style: {
      background: toastVariant,
      color: toastColor,
    }
  }

  return (
    <>
      {loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ""}

      <div className={loading ? loadingStyle : ""} >
      <NavbarComp perms={navbarperms} />

      <h1 className="text-center mt-5">Atualizar informações do cliente</h1>

      <div className="w-100 d-flex justify-content-center">
        <Toaster toastOptions={toastOptions} />
      </div>

      <Form className="container mt-5" onSubmit={updateClientInfos} noValidate validated={validated}>
        <div className="row">
          <div className="col-md-6">
            <Form.Label><b>CPF ou CNPJ:</b></Form.Label>
            <Form.Control required as={IMaskInput} mask={[{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }]} value={cpfcnpj}
            onBlur={(e) => {
              const valor = e.target.value.replace(/\D/g, '');
              
              if(valor.split("").length < 14){
                setLabelData("Data de nascimento")
                setCpfcnpj(e.target.value)
              }
              else if(valor.split("").length > 11){
                setLabelData("Data de abertura")
              }

              setCpfcnpj(e.target.value)
              return;
            }}
            
            onChange={(e) => {
              const valor = e.target.value.replace(/\D/g, '');
              
              if(valor.split("").length < 14){
                setLabelData("Data de nascimento")
                setCpfcnpj(e.target.value)
              }
              else if(valor.split("").length > 11){
                setLabelData("Data de abertura")
              }

              setCpfcnpj(e.target.value)
              return;

            }} placeholder="CPF ou CNPJ" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>
          <div className="col-md-6">
            <Form.Label><b>Nome:</b></Form.Label>
            <Form.Control required maxLength={70} value={nome} onChange={(e) => { setNome(e.target.value) }} placeholder="Nome" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-lg-3 mt-4 col-md-6 col-6">
            <Form.Label><b>{labelData}:</b></Form.Label>
            <Form.Control required type="date" value={birthdate} onChange={(e) => { setBirthdate(e.target.value) }} placeholder="yyyy/mm/dd" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>
          <div className="col-lg-4 mt-4 col-md-6 col-6">
            <Form.Label><b>Email: (opcional)</b></Form.Label>
            <Form.Control maxLength={70} value={email} onChange={(e) => { setEmail(e.target.value) }} placeholder="Email" type="email" />
          </div>
          <div className="col-lg-3 mt-4 col-md-6 col-6">
            <Form.Label><b>Telefone:</b></Form.Label>
            <Form.Control required as={IMaskInput} mask="(00)00000-0000" value={phone} onBlur={(e) => { setPhone(e.target.value) }} onChange={(e) => { setPhone(e.target.value) }} placeholder="Telefone" />
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
              label='Whatsapp'
            />
          </div>
        </div>

        <div className="row mt-5">
          <div className="col-md-6">
            <Form.Label><b>CEP:</b></Form.Label>
            <Form.Control required as={IMaskInput} mask="00000-000" value={cep} onChange={(e) => { handleCep(e.target.value) }} placeholder="CEP" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>

          <div className="col-md-6">
            <Form.Label><b>Logradouro:</b></Form.Label>
            <Form.Control required disabled value={logradouro} readOnly={true} placeholder="Logradouro" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>
        </div>

        <div className="row mt-5 mb-5">
          <div className="col-md-6">
            <Form.Label><b>Número:</b></Form.Label>
            <Form.Control required min={0} step={1} type="number" value={numero} onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()} onChange={(e) => { setNumero(e.target.value) }} placeholder="Número" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>

          <div className="col-md-6">
            <Form.Label><b>Complemento: (opcional)</b></Form.Label>
            <Form.Control maxLength={50} value={complemento} onChange={(e) => { setComplemento(e.target.value) }} placeholder="Complemento" />
          </div>
        </div>

        <div className="mb-2 text-center">
          <Button onClick={cancel} variant="secondary">
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