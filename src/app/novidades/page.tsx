"use client";

import NavbarComp from '../../../components/Navbar';

import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./page.module.css";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import { guard, useRedirect } from '../../../components/Guard';
import toast, { Toaster } from 'react-hot-toast';
import { ToastVariant, ToastColor } from '../../../components/ToastColors';
import Loading from '../../../components/Loading';
import { UserContext } from '../../../context/UserContext';
import { CompanyContext } from '../../../context/CompanyContext';
import { Dropdown, Form, Modal } from 'react-bootstrap';
import Validator from 'validatorjs';
import axios from 'axios';
import { ApiContext } from '../../../context/ApiContext';
import { WelcomeContext } from '../../../context/WelcomeContext';
import Footer from '../../../components/Footer';

function home() {
  const router = useRouter();
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");

  const { redirect } = useRedirect();
  const { getPersistAuth, deletePersistAuth } = useContext(UserContext);
  const { deleteCompany } = useContext(CompanyContext);
  const { getJwt, apiKey } = useContext(ApiContext);

  const [user, setUser] = useState(getPersistAuth());

  const config = {
    headers: {
      "Authorization": "Bearer " + getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }

  const [actualNew, setActualNew]: any = useState("");

  const [allVersions, setAllVersions]: any = useState([]);

  async function getAttItems() {
    setLoading(true);
    function compareCreatedAt(a: any, b: any) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    await axios.post(process.env.VERSIONING_SEARCH!, {}, config).then((res) => {
      const results = res.data.result;
      results.sort(compareCreatedAt);
      let items = [];

      for (const result of results) {
        if (result.active) {
          const found = user.companyId.some((r: any) => result.companyId.includes(r));
          if (result.global) {
            items.push(result);
          } else if (found) {
            items.push(result);
          }
        }
      }

      if (items.length > 0) {
        setAllVersions(items);
        setActualNew(items[0]);
        setVersionLabel(`Versão ${items[0].version}`)
      }
    });
    setLoading(false);
  }

  guard();

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string) {
    setToastVariant(toastVariant);
    setToastColor(toastColor);
    toast(message);
  }

  const [dataAtt, setDataAtt]: any = useState("");
  const [commentsAtt, setCommentsAtt]: any = useState([])

  useEffect(() => {
    getAttItems()
  }, [])

  useEffect(() => {
    function formatDate(date: any) {
      const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();

      return `${day} de ${month} de ${year}`;
    }

    if (actualNew && actualNew.createdAt) {
      const currentDate = new Date(actualNew.createdAt);
      const formattedDate = formatDate(currentDate);

      setDataAtt(formattedDate);
      setCommentsAtt(actualNew.comments);
    }
  }, [actualNew])


  let toastOptions = {
    className: '',
    duration: Number(process.env.TOAST_TIME!),
    style: {
      background: toastVariant,
      color: toastColor,
    }
  }

  const [versionLabel, setVersionLabel] = useState("Escolha a versão");

  return (
    <>
      {loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ""}
      <div className="w-100 d-flex justify-content-center">
        <Toaster toastOptions={toastOptions} />
      </div>
      <div className={loading ? loadingStyle : ""}>
        <NavbarComp />
        <div className="container-fluid h-100">
          <div className="row">
            <div className='col-md-12 w-100 border-bottom d-flex flex-grow-1 flex-column align-items-center justify-content-center pt-4 pb-4'>
              <p className='text-center fs-4'>📅 Notas de Versão</p>
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" id="dropdown-basic">
                  {versionLabel}
                </Dropdown.Toggle>

                {allVersions.length > 0 && <Dropdown.Menu style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {allVersions.map((i: any) => {
                    return <Dropdown.Item onClick={() => { setVersionLabel(`Versão ${i.version}`); setActualNew(i) }}>Versão {i.version}</Dropdown.Item>
                  })}
                </Dropdown.Menu>}
              </Dropdown>
            </div>
            <div className="row h-100">
              <div className='col-md-12 p-5 h-100 w-100'>
                {actualNew ?
                  (<>
                    <span className='fs-4'>📅 Notas da Versão {actualNew.version}</span>
                    <div className='ms-5 mt-2'>
                      <span>{dataAtt}</span>
                    </div>
                    <div className='ms-5 mt-4'>
                      <p className='fs-2'>🎉 Novidades!</p>
                      <ul>
                        {commentsAtt.map((i: any) => {
                          return (
                            <li>{i}</li>
                          )
                        })}
                      </ul>
                    </div>
                  </>) : (
                    <>
                      <div className='d-flex w-100 justify-content-center ps-2'>
                        <strong className='ms-4 fs-4 text-center'>Nenhuma novidade ainda.</strong>
                      </div>
                    </>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default home;
