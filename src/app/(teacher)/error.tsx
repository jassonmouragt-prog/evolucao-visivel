"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="panel"><h1>Não foi possível carregar esta página</h1><p className="muted my-5">Verifique sua conexão e tente novamente. Seus registros salvos continuam seguros.</p><button className="button" onClick={reset}>Tentar novamente</button></section>;}
