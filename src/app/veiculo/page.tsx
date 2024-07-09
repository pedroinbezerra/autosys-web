"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { useRouter } from 'next/navigation'
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import NavbarComp from "../../../components/Navbar";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { guard } from "../../../components/Guard";
import { IMaskInput } from "react-imask";
import Validator from 'validatorjs';
import toast, { Toaster } from 'react-hot-toast';
import { ToastVariant, ToastColor } from '../../../components/ToastColors';
import Loading from '../../../components/Loading';
import { UserContext } from "../../../context/UserContext";
import { ClientContext } from "../../../context/ClientContext";
import { ApiContext } from "../../../context/ApiContext";
import Footer from "../../../components/Footer";

function vehicle() {
  const router = useRouter();
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState('');

  const { getPersistAuth } = useContext(UserContext);
  const { getClient } = useContext(ClientContext);

  guard();

  const [fulluser, setFulluser]: any = useState(getPersistAuth())
  const [clienteSearch, setClientSearch]: any = useState(getClient())

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

  const [cliente, setCliente] = useState(clienteSearch && clienteSearch.fill && formatCnpjCpf(clienteSearch.document) || '');

  const [fabricante, setFabricante] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [ano, setAno] = useState('');
  const [placa, setPlaca] = useState('');
  const [observacao, setObservacao] = useState('');
  const [validated, setValidated] = useState(false);
  const [clientName, setClientName] = useState(clienteSearch && clienteSearch.fill && clienteSearch.name || '');
  const [disableSubmitButtonFormState, setDisableSubmitButtonFormState] = useState(true);

  const { getJwt, apiKey } = useContext(ApiContext);
  const config = {
    headers: {
      "Authorization": "Bearer " + getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }

  useEffect(() => {
    if (clienteSearch && clienteSearch.fill) {
      setDisableSubmitButtonFormState(false);
    }
  }, [])

  const validateClient = (document: string) => {
    axios.post(process.env.CLIENT_SEARCH!, { document: document }, config)
      .then(res => {
        if (res.data.result.length > 0) {
          setClientName(res.data.result[0].name)
          setDisableSubmitButtonFormState(false);
        } else {
          setClientName('');
          setDisableSubmitButtonFormState(true);
        }
      })
  }

  async function registryVehicle(event: any) {
    setLoading(true);
    const form = event.currentTarget;
    event.preventDefault();

    if (form.checkValidity() === false) {
      event.stopPropagation();
      setLoading(false);
      setValidated(true);
      return;
    }

    const document = cliente.replace(/\D/g, '');

    const rules = {
      year: "digits:4",
      plate: "size:7",
      clientId: "required",
    }

    const clientId: any = await axios.post(process.env.CLIENT_SEARCH!, { active: true, document: document }, config).then((response) => {
      const clientesReturn = response.data.result;

      if (clientesReturn.length > 0) {
        return response.data.result[0]._id;
      } else {
        return undefined;
      }
    }).catch((err) => {
      setLoading(false);
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao buscar cliente.*\n```js\n' + JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });

    const infos = {
      clientId: clientId,
      brand: fabricante.trim(),
      model: modelo.trim(),
      color: cor,
      year: ano,
      plate: placa.trim(),
      Observations: observacao.trim(),
    }

    let validation = new Validator(infos, rules);

    if (validation.fails()) {
      let message = '';

      if (validation.errors.get('plate').length > 0) {
        message = 'A placa precisa conter 7 caracteres';
      }

      else if (validation.errors.get('year').length > 0) {
        message = 'O ano precisa conter 4 números';
      }

      else if (validation.errors.get('clientId').length > 0) {
        message = 'O cliente não está cadastrado';
      }

      setLoading(false);
      showToast(ToastVariant.ERROR, ToastColor.LIGHT, message);
      return;
    }

    const payload = {
      clientId: clientId,
      brand: fabricante,
      model: modelo,
      color: cor,
      year: ano,
      active: true,
      plate: placa,
      Observations: observacao,
      createdBy: fulluser.username,
      companyId: fulluser.companyId,
    }

    const vehicleInfosSearch = {
      "plate": placa,
      "active": true,
      "companyId": fulluser.companyId,
    }

    axios.post(process.env.VEHICLE_SEARCH!, vehicleInfosSearch, config).then((res) => {
      if (res.data.result.length > 0) {
        setLoading(false);
        showToast(ToastVariant.ERROR, ToastColor.LIGHT, "O veículo já está cadastrado");
        return;
      }

      axios.post(process.env.VEHICLE!, payload, config).then(() => {
        setLoading(false);
        showToast(ToastVariant.SUCCESS, ToastColor.DARK, "Veículo cadastrado com sucesso!");

        setFabricante('');
        setCliente('');
        setModelo('');
        setCor('');
        setAno('');
        setPlaca('');
        setObservacao('');
        setClientName('')
        setValidated(false);
      }).catch((err) => {
        setLoading(false);
        const payload = {
          username: "Autosys Web",
          content: '*Erro ao criar veículo.*\n```js\n' + JSON.stringify(err) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      });
    }).catch((err) => {
      setLoading(false);
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao buscar veículo.*\n```js\n' + JSON.stringify(err) + '\n```'
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

  function formatCnpjCpf(cnpjCpf: string) {
    if (cnpjCpf.length === 11) {
      return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "\$1.\$2.\$3-\$4");
    }
    return cnpjCpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "\$1.\$2.\$3/\$4-\$5");
  }
  return (
    <>
      {loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ''}

      <div className={loading ? loadingStyle : ''} >
        <NavbarComp perms={navbarperms} />

        <h1 className="text-center mt-5">Cadastro de veículos</h1>
        <div className="w-100 d-flex justify-content-center">
          <Toaster toastOptions={toastOptions} />
        </div>

        <Form className="container mt-5" onSubmit={registryVehicle} noValidate validated={validated}>
          <div className="row">
            <div className="col-md-4">
              <Form.Label><b>Documento do cliente:</b></Form.Label>
              <Form.Control required
                as={IMaskInput}
                mask={[{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }]}
                value={cliente}
                onBlur={(e) => { setCliente(e.target.value) }}
                onChange={(e) => {
                  setCliente(e.target.value);
                  validateClient(e.target.value.replace(/\D/g, ''));
                }}
                placeholder="Documento do cliente"
              />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>

            <div className="col-md-8">
              <Form.Label><b>Nome:</b></Form.Label>
              <Form.Control required disabled value={clientName} placeholder="Nome do cliente" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
          </div>

          <div className="row mt-5">
            <div className="col-md-6">
              <Form.Label><b>Fabricante:</b></Form.Label>
              <Form.Control maxLength={25} required value={fabricante} onChange={(e) => { setFabricante(e.target.value) }} placeholder="Fabricante" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>

            <div className="col-md-6">
              <Form.Label><b>Modelo:</b></Form.Label>
              <Form.Control maxLength={25} required value={modelo} onChange={(e) => { setModelo(e.target.value) }} placeholder="Modelo" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
          </div>

          <div className="row mt-5">
            <div className="col-md-4">
              <Form.Label><b>Cor:</b></Form.Label>
              <Form.Control maxLength={25} required value={cor} onChange={(e) => { setCor(e.target.value) }} placeholder="Cor" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
            <div className="col-md-4">
              <Form.Label><b>Ano:</b></Form.Label>
              <Form.Control required as={IMaskInput} mask="0000" value={ano} onChange={(e) => { setAno(e.target.value) }} placeholder="Ano" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>

            <div className="col-md-4">
              <Form.Label><b>Placa:</b></Form.Label>
              <Form.Control onKeyDown={(evt) => !/^[a-zA-Z0-9]+$/.test(evt.key) && evt.preventDefault()} required as={IMaskInput} mask="*******" value={placa} onBlur={(e) => { setPlaca(e.target.value.toUpperCase()) }} onChange={(e) => { setPlaca(e.target.value.toUpperCase()) }} placeholder="Placa" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
          </div>

          <div className="row mt-5 mb-5">
            <div className="col-md-12">
              <Form.Label><b>Observações: (opcional)</b></Form.Label>
              <Form.Control value={observacao} onChange={(e) => { setObservacao(e.target.value) }} as="textarea" rows={5} />
            </div>
          </div>

          <div className="mb-2 text-center">
            <Button onClick={() => { router.push("/home") }} variant="secondary">
              Cancelar
            </Button>{' '}
            <Button variant="primary" type="submit" disabled={disableSubmitButtonFormState}>
              Salvar
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
}

export default vehicle;
