import { Component, ErrorInfo, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Dioris Planner runtime error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{position:"fixed",inset:0,zIndex:999999,display:"grid",placeItems:"center",background:"#080a10",color:"#fff",fontFamily:"Arial,sans-serif",padding:20}}>
          <div style={{width:"min(760px,100%)",padding:24,border:"1px solid #3a4053",borderRadius:14,background:"#11141c"}}>
            <h1 style={{marginTop:0,fontSize:22}}>O Planner encontrou um erro</h1>
            <p style={{color:"#aab4c6"}}>Copie a mensagem abaixo. Ela não ficará mais escondida em uma tela vazia.</p>
            <pre style={{whiteSpace:"pre-wrap",overflow:"auto",padding:14,borderRadius:9,background:"#241116",color:"#ff9b9b"}}>{this.state.error.stack || this.state.error.message}</pre>
            <button style={{padding:"10px 14px",border:0,borderRadius:8,background:"#6366f1",color:"white"}} onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
