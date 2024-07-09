"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { useRouter } from 'next/navigation'
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import InputGroup from 'react-bootstrap/InputGroup';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import NavbarComp from "../../../components/Navbar";
import { guard } from "../../../components/Guard";
import { IMaskInput } from "react-imask";
import Validator from 'validatorjs';
import toast, { Toaster } from 'react-hot-toast';
import { ToastVariant, ToastColor } from '../../../components/ToastColors';
import Loading from '../../../components/Loading';
import { UserContext } from "../../../context/UserContext";
import CurrencyInput from 'react-currency-input-field';
import { v4 as uuid } from 'uuid';
import { VehicleContext } from "../../../context/VehicleContext";
import { ApiContext } from "../../../context/ApiContext";
import { CompanyContext } from "../../../context/CompanyContext";
import Footer from "../../../components/Footer";

function cliente() {
  const router = useRouter();
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");

  const { getPersistAuth } = useContext(UserContext);
  const { getVehicle } = useContext(VehicleContext);

  guard();

  const [fulluser, setFulluser]: any = useState(getPersistAuth());
  const [vehicle, setVehicle]: any = useState(getVehicle());
  const { getJwt, apiKey } = useContext(ApiContext);

  const config = {
    headers: {
      "Authorization": "Bearer " + getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }

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

  function formatCnpjCpf(cnpjCpf: string) {
    if (cnpjCpf.length === 11) {
      return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "\$1.\$2.\$3-\$4");
    }
    return cnpjCpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "\$1.\$2.\$3/\$4-\$5");
  }

  const [descricaoServico, setDescricaoServico]: any = useState([]);
  const [plate, setPlate] = useState(vehicle && vehicle.fill && vehicle.plate || "");
  const [document, setDocument] = useState("");
  const [createdAt, setCreatedAt] = useState('');

  const [descricao, setDescricao] = useState('');

  const [valor, setValor]: any = useState('');
  const [valorLabel, setValorLabel]: any = useState('');

  const [warranty, setWarranty] = useState('');

  const [off, setOff]: any = useState(0);
  const [offLabel, setOffLabel]: any = useState(0);
  const [offType, setOffType] = useState("perce")

  const [formaPagamentoLabel, setFormaPagamentoLabel] = useState('Forma de pagamento');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [paymentDetail, setPaymentDetail] = useState('');
  const [pagamentoTotal, setPagamentoTotal]: any = useState(0.00);

  const [ano, setAno] = useState('');
  const [cor, setCor] = useState('');
  const [modelo, setModelo] = useState('');

  const [validated, setValidated] = useState(false);
  const [cliente, setCliente]: any = useState("");

  async function setYearColorModel(fill: boolean) {
    setLoading(true);
    if (fill) {
      await axios.post(process.env.VEHICLE_SEARCH!, { plate: plate, active: true, companyId: fulluser.companyId }, config).then(async (response) => {
        const veiculos: any = response.data.result;
        const cliente = await axios.post(process.env.CLIENT_SEARCH!, { active: true, _id: veiculos[0].clientId, companyId: fulluser.companyId }, config).then((res) => {
          const documento = res.data.result[0];

          if (documento) {
            return documento;
          }

          else {
            showToast(ToastVariant.ERROR, ToastColor.LIGHT, "Não foi possível obter o documento do cliente")
            return "";
          }
        }).catch(() => {
          showToast(ToastVariant.ERROR, ToastColor.LIGHT, "Não foi possível obter o documento do cliente")
          return "";
        });

        setAno(veiculos[0].year);
        setCor(veiculos[0].color);
        setModelo(veiculos[0].model);

        setCliente(cliente);

        if (cliente && cliente.document) {
          setDocument(cliente.document);
        }

        setLoading(false);
      }).catch((err) => {
        setLoading(false);
        showToast(ToastVariant.ERROR, ToastColor.LIGHT, "O veículo não está cadastrado")
      });
    } else {
      setAno('');
      setCor('');
      setCliente("");
      setModelo('');
      setDocument('');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (plate.length == 7) setYearColorModel(true);
    if (!plate || plate.length != 7) setYearColorModel(false);
  }, [plate]);

  function updateTotal() {
    let offTotal = 0;
    let total = 0;
    descricaoServico && descricaoServico.forEach((v: any) => {
      let value = (Number(v.off) / 100) * parseFloat(v.cost);
      if (v.off == 100) {
        total += 0;
      } else {
        offTotal += value;
        total += parseFloat(v.cost);
      }
    });

    setPagamentoTotal(parseFloat((total - offTotal).toString()).toFixed(2));
  }

  const novaDescricao = () => {
    const infos = {
      description: descricao,
      warranty,
      cost: valor,
      off
    }

    const rules = {
      description: "required",
      cost: "required",
    }

    const validation = new Validator(infos, rules);

    if (validation.fails()) {
      let message = '';

      if (validation.errors.get('description').length > 0) {
        message = 'O campo de descrição precisa ser preenchido';
      }

      else if (validation.errors.get('cost').length > 0) {
        message = 'O campo de valor precisa ser preenchido';
      }

      showToast(ToastVariant.ERROR, ToastColor.LIGHT, message);
      return;
    }

    setDescricaoServico([...descricaoServico, { key: uuid(), cost: valor, description: descricao, off, warranty }]);

    setValor('');
    setValorLabel('');
    setDescricao('');
    setWarranty('');
    setOff(0);
    setOffLabel(0);

    showToast(ToastVariant.SUCCESS, ToastColor.DARK, "Descrição Adicionada com sucesso");
  }

  const handleFormaPagamento = (formaPagamento: string) => {
    setFormaPagamento(formaPagamento)

    switch (formaPagamento) {
      case 'CREDIT':
        setFormaPagamentoLabel('Cartão')
        break;

      case 'DEBIT':
        setFormaPagamentoLabel('Débito')
        break;

      case 'PIX':
        setFormaPagamentoLabel('PIX')
        break;

      case 'CHEQUE':
        setFormaPagamentoLabel('Cheque')
        break;

      case 'CASH':
        setFormaPagamentoLabel('Espécie')
        break;

      default:
        setFormaPagamentoLabel('Forma de pagamento')
        setFormaPagamentoLabel('')
        break;
    }
  }

  const colMd4 = `col-md-2 mt-3 d-flex align-items-center`;

  function removeDescription(id: any) {
    setDescricaoServico(descricaoServico.filter((item: any) => item.key !== id));
    showToast(ToastVariant.SUCCESS, ToastColor.DARK, "Descrição Removida com sucesso");
  }

  useEffect(() => {
    updateTotal();
  }, [descricaoServico]);

  async function registerService(event: any) {
    setLoading(true);
    const form = event.currentTarget;
    event.preventDefault();

    if (form.checkValidity() === false) {
      event.stopPropagation();
      setLoading(false);
      setValidated(true);
      return;
    }

    const clearDocument = document.replace(/\D/g, "");

    const clientes = await axios.post(process.env.CLIENT_SEARCH!, { document: clearDocument, active: true, companyId: fulluser.companyId }, config).then((response) => {
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
      return false;
    });

    const veiculos = await axios.post(process.env.VEHICLE_SEARCH!, { plate: plate, active: true, companyId: fulluser.companyId }, config).then((response) => {
      const veiculsoReturn = response.data.result;

      if (veiculsoReturn.length > 0) {
        return response.data.result[0]._id;
      } else {
        return undefined;
      }
    }).catch((err) => {
      setLoading(false);
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao buscar veículo.*\n```js\n' + JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });

    const description = descricaoServico && descricaoServico.map((value: any) => {
      return {
        description: value.description,
        cost: value.cost,
        warranty: value.warranty,
        off: value.off,
      }
    });

    const infos = {
      document: clearDocument,
      plate: plate,
      clientId: clientes,
      vehicleId: veiculos,
      active: true,
      paymentForm: formaPagamento,
      paymentDetail: paymentDetail,
      createdBy: fulluser.username,
      companyId: fulluser.companyId[0],
      createdAt: new Date(`${createdAt.split("/")[2]}/${createdAt.split("/")[1]}/${createdAt.split("/")[0]}`).toISOString(),
      description: description,
    }

    const rules = {
      document: "",
      plate: "size:7",
      paymentForm: "required",
      clientId: "required",
      vehicleId: "required",
      description: "required",
    }

    if (clearDocument.length > 11) {
      rules.document = "digits:14"
    } else {
      rules.document = "digits:11"
    }

    const validation = new Validator(infos, rules);

    if (validation.fails()) {
      let message = '';

      if (validation.errors.get('document').length > 0) {
        message = 'Tamanho mínimo do documento: 11 dígitos';
      }

      else if (validation.errors.get('plate').length > 0) {
        message = 'A placa do cliente deve conter 7 caracteres';
      }

      else if (validation.errors.get('paymentForm').length > 0) {
        message = 'A forma de pagamento deve ser especificada';
      }

      else if (validation.errors.get('vehicleId').length > 0) {
        message = "O veículo não está cadastrado";
      }

      else if (validation.errors.get('clientId').length > 0) {
        message = "O cliente não está cadastrado";
      }

      else if (validation.errors.get('description').length > 0) {
        message = "É obrigatório ter pelo menos um item no serviço";
      }

      showToast(ToastVariant.ERROR, ToastColor.LIGHT, message);
      setLoading(false);
      return;
    }

    axios.post(process.env.SERVICE!, infos, config).then((res) => {
      setLoading(false);
      showToast(ToastVariant.SUCCESS, ToastColor.DARK, "Serviço criado com sucesso!");

      setDocument("");
      setPlate("");
      setFormaPagamento("");
      setFormaPagamentoLabel("Forma de pagamento");
      setPaymentDetail("");
      setCreatedAt("");
      setDescricaoServico("");

      setValor('');
      setDescricao('');
      setWarranty('');
      setOff('');
      setValidated(false);
    }).catch((err) => {
      setLoading(false);
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao criar serviço.*\n```js\n' + JSON.stringify(err) + '\n```'
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
      {loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ""}

      <div className={loading ? loadingStyle : ""} >
        <NavbarComp perms={navbarperms} />

        <h1 className="text-center mt-5">Cadastro de serviços</h1>
        <div className="w-100 d-flex justify-content-center">
          <Toaster toastOptions={toastOptions} />
        </div>

        <Form className="container mt-5" onSubmit={registerService} noValidate validated={validated}>
          <div className="row">
            <div className="col-md-4">
              <Form.Label><b>Data do serviço:</b></Form.Label>
              <Form.Control required type="date" value={createdAt} onChange={(e) => { setCreatedAt(e.target.value) }} placeholder="dd/mm/aaaa" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
            <div className="col-md-4">
              <Form.Label><b>Placa:</b></Form.Label>
              <Form.Control required as={IMaskInput} mask="*******" value={plate} onBlur={(e) => { setPlate(e.target.value.toUpperCase()) }} onChange={(e) => { setPlate(e.target.value.toUpperCase()) }} placeholder="Placa" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
            <div className="col-md-4">
              <Form.Label><b>Documento do cliente:</b></Form.Label>
              <Form.Control required as={IMaskInput} mask={[{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }]} value={document} readOnly disabled placeholder="Documento do cliente" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
          </div>

          <div className="row mt-5">
            <div className="col-md-4">
              <Form.Label><b>Ano:</b></Form.Label>
              <Form.Control disabled as={IMaskInput} mask="0000" value={ano} placeholder="Ano" readOnly={true} />
            </div>

            <div className="col-md-4">
              <Form.Label><b>Cor:</b></Form.Label>
              <Form.Control disabled value={cor} placeholder="Cor" readOnly={true} />
            </div>

            <div className="col-md-4">
              <Form.Label><b>Modelo:</b></Form.Label>
              <Form.Control disabled value={modelo} placeholder="Modelo" readOnly={true} />
            </div>
          </div>

          {cliente ? (
            <>
              <h4 className="mt-5"><b>Informações do cliente:</b></h4>
              <div className="row">
                <div className={cliente.email ? "col-md-4" : "col-md-6"}>
                  <Form.Label><b>Nome:</b></Form.Label>
                  <Form.Control disabled value={cliente.name} title={cliente.name} placeholder="Nome" readOnly />
                </div>
                <div className={cliente.email ? "col-md-4" : "col-md-6"}>
                  <Form.Label><b>Telefone {cliente.phoneIsWhatsapp ? "(Whatsapp)" : ""}:</b></Form.Label>
                  <Form.Control disabled value={cliente.phone} title={cliente.phone} placeholder="Telefone" readOnly />
                </div>
                {cliente.email ? (
                  <>
                    <div className="col-md-4">
                      <Form.Label><b>Email:</b></Form.Label>
                      <Form.Control disabled title={cliente.email} value={cliente.email} placeholder="Email" readOnly />
                    </div>
                  </>
                ) : ""}
              </div>
            </>
          ) : ""}

          <h4 className="mt-5"><b>Itens do serviço:</b></h4>

          {descricaoServico && descricaoServico.map((value: any) => {
            if (value.key === null) return;
            const index = descricaoServico.findIndex((x: any) => x.key == value.key);
            return (
              <div key={value.key} className="mb-2 mt-2">
                <div className="row">
                  <div className="mb-3 col-md-12">
                    <Form.Label><b>Descrição:</b></Form.Label>
                    <Form.Control maxLength={100} required defaultValue={value.description} onChange={(e) => { descricaoServico[index].description = e.target.value }} placeholder="Descrição" />
                    <Form.Control.Feedback type="invalid">
                      Campo obrigatório
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="row">
                  <div className="mb-3 col-md-2">
                    <Form.Label><b>Garantia:</b></Form.Label>
                    <Form.Control type="date" defaultValue={value.warranty} onChange={(e) => { descricaoServico[index].warranty = e.target.value }} placeholder="dd/mm/aaaa" />
                  </div>
                  <div className="mb-3 col-md-4">
                    <Form.Label><b>Desconto:</b></Form.Label>
                    <InputGroup className="mb-3">
                      <CurrencyInput className="form-control" value={descricaoServico[index].off} allowDecimals={false} allowNegativeValue={false} defaultValue={descricaoServico[index].off} onValueChange={(val, name, v) => {
                        const valor = v?.float;

                        if (!valor) {
                          descricaoServico[index].off = 0;
                        }
                        if (valor && valor <= 100 && valor >= 0) {
                          descricaoServico[index].off = valor;
                        }
                        else if (valor && valor > 100) {
                          descricaoServico[index].off = 100;
                        }
                        else if (valor && valor < 0) {
                          descricaoServico[index].off = 0;
                        }

                        updateTotal();
                      }} placeholder="Desconto" />
                      <InputGroup.Text>%</InputGroup.Text>
                    </InputGroup>
                  </div>
                  <div className="mb-3 col-md-4">
                    <Form.Label><b>Valor:</b></Form.Label>
                    <InputGroup className="mb-3">
                      <InputGroup.Text>R$</InputGroup.Text>
                      <CurrencyInput className="form-control" allowNegativeValue={false} decimalsLimit={2} defaultValue={value.cost} onValueChange={(val, na, v) => {
                        descricaoServico[index].cost = v?.float?.toFixed(2);
                        updateTotal();
                      }} placeholder="Valor" />
                    </InputGroup>
                    <Form.Control.Feedback type="invalid">
                      Campo obrigatório
                    </Form.Control.Feedback>
                  </div>
                  <div className="col-md-2 d-flex align-items-center">
                    <Button onClick={() => { removeDescription(value.key) }} variant="danger">
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="mt-4"></div>
          <div className="row">
            <div className="mb-3 col-md-12">
              <Form.Label><b>Descrição:</b></Form.Label>
              <Form.Control maxLength={100} value={descricao} onChange={(e) => { setDescricao(e.target.value) }} placeholder="Descrição" />
            </div>
          </div>
          <div className="row">
            <div className="mb-3 col-md-4">
              <Form.Label><b>Garantia:</b></Form.Label>
              <Form.Control type="date" value={warranty} onChange={(e) => { setWarranty(e.target.value) }} placeholder="dd/mm/aaaa" />
            </div>
            <div className="mb-3 col-md-4">
              <Form.Label><b>Desconto:</b></Form.Label>
              <InputGroup className="mb-3">
                <CurrencyInput className="form-control" allowNegativeValue={false} allowDecimals={false} value={offLabel} onValueChange={(value, name, v) => {
                  const valor = v?.float;

                  if (!valor) {
                    setOff(0);
                    setOffLabel(0);
                  }

                  if (valor && valor <= 100 && valor >= 0) {
                    setOff(valor);
                    setOffLabel(valor);
                  }
                  else if (valor && valor > 100) {
                    setOff(100);
                    setOffLabel(100);
                  }
                  else if (valor && valor < 0) {
                    setOff(0)
                    setOffLabel(0);
                  }
                }} placeholder="Desconto" />
                <InputGroup.Text>%</InputGroup.Text>
              </InputGroup>
            </div>
            <div className="mb-3 col-md-4">
              <Form.Label><b>Valor:</b></Form.Label>
              <InputGroup className="mb-3">
                <InputGroup.Text>R$</InputGroup.Text>
                <CurrencyInput className="form-control" allowNegativeValue={false} value={valorLabel} onValueChange={(value, name, v) => {
                  setValor(v?.float?.toFixed(2));
                  setValorLabel(v?.value);
                }} placeholder="Valor" />
              </InputGroup>
            </div>
          </div>

          <div className="mt-3 text-center">
            <Button onClick={novaDescricao} variant="primary">
              Adicionar item
            </Button>
          </div>

          <div className="row mt-5">
            <div className="col-md-3">
              <Form.Label><b>Total:</b></Form.Label>
              <InputGroup className="mb-3">
                <InputGroup.Text>R$</InputGroup.Text>
                <CurrencyInput className="form-control" value={pagamentoTotal} readOnly={true} decimalsLimit={2} />
              </InputGroup>
            </div>
            <div className="col-md-6">
              <Form.Label><b>Detalhes do Pagamento:</b></Form.Label>
              <Form.Control maxLength={50} value={paymentDetail} onChange={(e) => { setPaymentDetail(e.target.value) }} placeholder="Descrição" />
            </div>
            <div className={colMd4}>
              <DropdownButton id="dropdown-basic-button" title={formaPagamentoLabel}>
                <Dropdown.Item onClick={() => handleFormaPagamento('CREDIT')}>Cartão</Dropdown.Item>
                <Dropdown.Item onClick={() => handleFormaPagamento('DEBIT')}>Débito</Dropdown.Item>
                <Dropdown.Item onClick={() => handleFormaPagamento('PIX')}>PIX</Dropdown.Item>
                <Dropdown.Item onClick={() => handleFormaPagamento('CHEQUE')}>Cheque</Dropdown.Item>
                <Dropdown.Item onClick={() => handleFormaPagamento('CASH')}>Espécie</Dropdown.Item>
              </DropdownButton>
            </div>
          </div>

          <div className="mt-5 mb-2 text-center">
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
