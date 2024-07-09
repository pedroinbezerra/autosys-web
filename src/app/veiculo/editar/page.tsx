"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { useRouter } from 'next/navigation';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import NavbarComp from "../../../../components/Navbar";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { guard } from "../../../../components/Guard/index";
import { IMaskInput } from "react-imask";
import Validator from 'validatorjs';
import toast, { Toaster } from 'react-hot-toast';
import {ToastVariant, ToastColor} from '../../../../components/ToastColors';
import Loading from '../../../../components/Loading';
import { VehicleContext } from '../../../../context/VehicleContext';
import { UserContext } from '../../../../context/UserContext'
import { ApiContext } from "../../../../context/ApiContext";
import Footer from "../../../../components/Footer";

function editVehicle() {
  const router = useRouter();
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");

  const {getVehicle, deleteVehicle, setVehicle} = useContext(VehicleContext);
  const {getPersistAuth} = useContext(UserContext);
  const {getJwt, apiKey} = useContext(ApiContext);
  const config = {
    headers:{
      "Authorization": "Bearer "+getJwt(),
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

  const [vehicleInfos, setvehicleInfos]: any = useState(getVehicle());
  useEffect(() => {
    setLoading(true);
    const vehicle = getVehicle();
    if(!vehicle.edit) {
      if(typeof window != "undefined") {
        router.push("/veiculo/buscar")
        return;
      }
    }

    setLoading(false);
    setvehicleInfos(getVehicle());
  }, [])
  if (typeof window !== "undefined") {
    if (!vehicleInfos._id) router.push("/veiculo/buscar");
  }

  function cancel() {
    setLoading(true);
    deleteVehicle();
    if(typeof window != "undefined") {
      router.push("/veiculo/buscar");
    }
  }

  async function getClient() {
    const client = await axios.post(process.env.CLIENT_SEARCH!, { _id: vehicleInfos.clientId }, config).then((res) => res.data.result).catch((err) => {
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao buscar cliente.*\n```js\n' +JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });
    if (client && client[0].document) return setCliente(client[0].document);
    setCliente("");
  }

  useEffect(() => {
    getClient();
  }, [])

  const [cliente, setCliente] = useState('');
  const [fabricante, setFabricante] = useState(vehicleInfos && vehicleInfos.brand);
  const [modelo, setModelo] = useState(vehicleInfos && vehicleInfos.model);
  const [cor, setCor] = useState(vehicleInfos && vehicleInfos.color);
  const [ano, setAno] = useState(vehicleInfos && vehicleInfos.year);
  const [placa, setPlaca] = useState(vehicleInfos && vehicleInfos.plate);
  const [observacao, setObservacao] = useState(vehicleInfos && vehicleInfos.Observations);
  const [validated, setValidated] = useState(false);

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

  async function updateVehicle(event:any) {
    const form = event.currentTarget;
    event.preventDefault();
    setLoading(true);

    if (form.checkValidity() === false) {
      event.stopPropagation();
      setLoading(false);
      setValidated(true);
      return;
    }

    const document = cliente.replace(/\D/g, "");
    const clientId: any = await axios.post(process.env.CLIENT_SEARCH!, { active: true, document: document }, config).then((response) => {
      const clientesReturn = response.data.result;

      if(clientesReturn.length > 0) {
        return response.data.result[0]._id;
      } else {
        return undefined;
      }
    }).catch((err) => {
      setLoading(false);
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao buscar cliente.*\n```js\n' +JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });

    const rules = {
      year: "digits:4",
      plate: "size:7",
      clientId: "required"
    }

    const infos = {
      year: ano,
      plate: placa,
      clientId: clientId
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

      else if (validation.errors.get('clientId').length > 0){
        message = 'O cliente não está cadastrado';
      }

      setLoading(false);
      showToast(ToastVariant.ERROR, ToastColor.LIGHT, message);
      return;
    }

    const payload = {
      _id: vehicleInfos._id,
      clientId: clientId,
      brand: fabricante,
      model: modelo,
      color: cor,
      year: ano,
      plate: placa,
      Observations: observacao,
      updatedBy: fulluser.username,
      createdBy: fulluser.username,
      companyId: fulluser.companyId,
    }

    await axios.patch(process.env.VEHICLE!, payload, config).then(async () => {
      if (typeof window != "undefined") {
        await axios.post(process.env.VEHICLE_SEARCH!, {_id: payload._id}, config).then(res => {
          const newVehicleInfos = res.data.result[0];
          setVehicle(newVehicleInfos);
          setLoading(false);
          setValidated(false);
          showToast(ToastVariant.SUCCESS, ToastColor.DARK, "Veículo editado com sucesso!");
        }).catch((err) => {
          setLoading(false);
          const payload = {
            username: "Autosys Web",
            content: '*Erro ao atualizar veículo.*\n```js\n' +JSON.stringify(err) + '\n```'
          }
    
          axios.post(process.env.DISCORD_WEBHOOK!, payload);
        });
      }
    }).catch((err) => {
      setLoading(false);
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao atualizar veículo.*\n```js\n' +JSON.stringify(err) + '\n```'
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
  
  return (
    <>
      { loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ""}

      <div className={loading ? loadingStyle : ""} >
      <NavbarComp perms={navbarperms} />

      <h1 className="text-center mt-5">Editar veículo</h1>
      <div className="w-100 d-flex justify-content-center">
        <Toaster toastOptions={toastOptions} />
      </div>

      <Form className="container mt-5" onSubmit={updateVehicle} noValidate validated={validated}>
        <div className="row">
          <div className="col-md-4">
            <Form.Label><b>Documento do Cliente:</b></Form.Label>
            <Form.Control required as={IMaskInput} mask={[{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }]} value={cliente} onBlur={(e) => { setCliente(e.target.value) }} onChange={(e) => { setCliente(e.target.value) }} placeholder="Cliente" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>
          <div className="col-md-4">
            <Form.Label><b>Fabricante:</b></Form.Label>
            <Form.Control required maxLength={25} value={fabricante} onChange={(e) => { setFabricante(e.target.value) }} placeholder="Fabricante" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>

          <div className="col-md-4">
            <Form.Label><b>Modelo:</b></Form.Label>
            <Form.Control required maxLength={25} value={modelo} onChange={(e) => { setModelo(e.target.value) }} placeholder="Modelo" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>
        </div>

        <div className="row mt-5">
          <div className="col-md-4">
            <Form.Label><b>Cor:</b></Form.Label>
            <Form.Control required maxLength={25} value={cor} onChange={(e) => { setCor(e.target.value) }} placeholder="Cor" />
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
          <Button onClick={cancel} variant="secondary">
            Cancelar
          </Button>{' '}
          <Button variant="primary" type="submit">
            Atualizar Informações
          </Button>
        </div>
      </Form>
      </div>
    </>
  );
}

export default editVehicle;