import React from "react";

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const particlesRef = React.useRef<any[]>([]);
  const mouseRef = React.useRef({ x: 0, y: 0, isPressed: false });
  const animationRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      alpha: number;

      constructor(x: number, y: number, vx: number, vy: number, size: number, color: string, life: number = 100) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.life = life;
        this.alpha = 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.02; // gravity light
        this.life -= 1;
        this.alpha = Math.max(0, this.life / 80);
        
        // Follow mouse attraction
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          const force = (200 - dist) / 200 * 0.08;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }
        
        // Slow down
        this.vx *= 0.98;
        this.vy *= 0.98;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
      }
    }

    const colors = ['#22d3ee', '#a5f3fc', '#67e8f9', '#c084fc', '#e0f2fe'];

    // Create initial particles
    const createInitialParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 120; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const vx = (Math.random() - 0.5) * 1.2;
        const vy = (Math.random() - 0.5) * 1.2;
        const size = Math.random() * 3 + 1.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particlesRef.current.push(new Particle(x, y, vx, vy, size, color, 300 + Math.random() * 200));
      }
    };

    createInitialParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections between close particles
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.1)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 110) {
            ctx.globalAlpha = (110 - dist) / 110 * 0.3;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Update and draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.update();
        p.draw(ctx);
        
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Add new particles occasionally
      if (Math.random() < 0.4 && particlesRef.current.length < 180) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.6);
        const vx = (Math.random() - 0.5) * 0.8;
        const vy = (Math.random() - 0.5) * 0.8;
        const size = Math.random() * 2.5 + 1;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particlesRef.current.push(new Particle(x, y, vx, vy, size, color, 220));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      
      // Create trail particles on move
      if (Math.random() < 0.6) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        for (let i = 0; i < 2; i++) {
          const vx = (Math.random() - 0.5) * 3.5;
          const vy = (Math.random() - 0.5) * 3.5;
          const size = Math.random() * 2.5 + 1;
          particlesRef.current.push(new Particle(
            e.clientX, 
            e.clientY, 
            vx, 
            vy, 
            size, 
            color, 
            35
          ));
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      mouseRef.current.isPressed = true;
      
      const colorOptions = ['#22d3ee', '#c084fc', '#67e8f9'];
      
      // Explosion
      for (let i = 0; i < 65; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 4.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 1.5;
        const size = Math.random() * 3.5 + 2;
        const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
        const life = 55 + Math.random() * 45;
        
        particlesRef.current.push(new Particle(
          e.clientX, 
          e.clientY, 
          vx, 
          vy, 
          size, 
          color, 
          life
        ));
      }
      
      // Extra burst
      setTimeout(() => {
        for (let i = 0; i < 25; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.8 + Math.random() * 2.2;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          const size = Math.random() * 2 + 1.5;
          const color = '#e0f2fe';
          particlesRef.current.push(new Particle(e.clientX, e.clientY, vx, vy, size, color, 75));
        }
      }, 40);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition - bodyRect - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const portfolioItems = [
    {
      id: 1,
      title: "Organização e Catalogação de Acervo Histórico",
      challenge: "O Instituto de Física (IF) lidava com um vasto acervo de arquivos físicos desorganizados, incluindo documentos históricos valiosos do próprio Instituto.",
      solution: "Realizamos a organização e catalogação em ordem cronológica. A colaboração com a EJ de História da UnB (Atena) assegurou não só a organização, mas também a preservação e a correta valorização histórica de cada documento.",
      result: "Otimização significativa do tempo de localização de qualquer arquivo. Os documentos foram organizados e tratados com o devido cuidado técnico, garantindo a integridade do patrimônio histórico do Instituto.",
      icon: "📚"
    },
    {
      id: 2,
      title: "Simulação Populacional",
      challenge: "O cliente buscava modelar a dinâmica populacional de uma espécie de insetos. Ele já possuía uma equação inicial baseada em seus dados experimentais.",
      solution: "Implementamos o sistema utilizando as equações de Lotka–Volterra Generalizadas, que permitem incorporar efeitos de competição, predação e autocontrole populacional.",
      result: "Desenvolvimento de uma simulação populacional com precisão, permitindo ao cliente analisar a evolução temporal da população.",
      icon: "🐛"
    },
    {
      id: 3,
      title: "Criação de Equação Aplicada a Sistema Biológico",
      challenge: "O cliente possuía diversos dados empíricos sobre a migração de neutrófilos e precisava de uma equação matemática para descrever o fenômeno biológico.",
      solution: "Aplicamos a técnica de Regressão Simbólica, uma metodologia de Machine Learning, utilizando Python para encontrar um modelo que melhor se ajusta aos dados da migração celular.",
      result: "Criação e entrega de uma equação precisa e inovadora que modela o sistema biológico em questão. Isso proporcionou ao pesquisador uma ferramenta analítica muito satisfatória e de grande importância.",
      icon: "🧬"
    },
    {
      id: 4,
      title: "Precificação de Serviços com Ferramenta Otimizada",
      challenge: "As clientes tinham dificuldade em determinar a rentabilidade de seu trabalho. Por ser um trabalho artesanal, manual e único, não podiam manter um preço tabelado, gerando incertezas se estavam ou não obtendo lucro.",
      solution: "Desenvolvemos uma planilha em Excel personalizada que automatiza o cálculo. O sistema permite calcular o gasto com material, considerar o valor de mão de obra e equipamento, levar em conta a delicadeza do trabalho e aplicar a margem de lucro desejada.",
      result: "Entrega de uma ferramenta financeira que auxilia na determinação do preço final. A ferramenta eliminou o peso da incerteza, permitindo aos clientes gerenciarem a lucratividade de forma objetiva.",
      icon: "📊"
    }
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-950 text-white font-sans">
      {/* Particle Background */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 z-0 pointer-events-auto"
        style={{ background: 'radial-gradient(circle at center, #18181b 0%, #09090b 70%)' }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-[0_0_25px_-3px] shadow-cyan-400">
              <span className="text-white text-xl font-bold tracking-tighter">Q</span>
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tighter">QUARK UP</div>
              <div className="text-[10px] text-cyan-400 -mt-1 tracking-[2px]">FÍSICA JR</div>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10 text-sm uppercase tracking-widest font-medium">
            <button onClick={() => scrollToSection('inicio')} className="hover:text-cyan-400 transition-colors">INÍCIO</button>
            <button onClick={() => scrollToSection('sobre')} className="hover:text-cyan-400 transition-colors">SOBRE</button>
            <button onClick={() => scrollToSection('portfolio')} className="hover:text-cyan-400 transition-colors">PORTFÓLIO</button>
            <button onClick={() => scrollToSection('contato')} className="hover:text-cyan-400 transition-colors">CONTATO</button>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-2xl"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-zinc-950 pt-20">
            <div className="flex flex-col items-center gap-8 text-2xl py-12">
              <button onClick={() => scrollToSection('inicio')} className="hover:text-cyan-400">Início</button>
              <button onClick={() => scrollToSection('sobre')} className="hover:text-cyan-400">Sobre</button>
              <button onClick={() => scrollToSection('portfolio')} className="hover:text-cyan-400">Portfólio</button>
              <button onClick={() => scrollToSection('contato')} className="hover:text-cyan-400">Contato</button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="inicio" className="relative min-h-screen flex items-center justify-center z-10 pt-16">
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 text-cyan-300 text-xs tracking-[3px] px-5 py-2.5 rounded-3xl border border-white/10 mb-6">
            EMPRESA JÚNIOR DE FÍSICA DA UNB
          </div>
          
          <h1 className="text-7xl md:text-[92px] font-bold tracking-tighter leading-none mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-400">
            QUARK UP
          </h1>
          
          <p className="max-w-lg mx-auto text-2xl md:text-3xl text-zinc-400 font-light mb-10">
            Soluções científicas com precisão quântica
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => scrollToSection('portfolio')}
              className="px-10 py-4 bg-white text-zinc-950 font-semibold rounded-2xl hover:bg-cyan-300 transition-all active:scale-[0.985] flex items-center justify-center gap-3 group"
            >
              VER PROJETOS 
              <span className="text-lg group-active:rotate-45 transition">→</span>
            </button>
            
            <button 
              onClick={() => scrollToSection('contato')}
              className="px-10 py-4 border border-white/30 hover:border-white/70 font-medium rounded-2xl transition-all"
            >
              FALE CONOSCO
            </button>
          </div>

          <div className="mt-20 text-xs tracking-widest opacity-50">CLIQUE NA TELA PARA EXPLORAR AS PARTÍCULAS</div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 flex flex-col items-center gap-2">
          <div className="text-[10px] tracking-widest">SCROLL</div>
          <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="relative z-10 py-24 bg-zinc-950 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid md:grid-cols-12 gap-16 items-center">
            <div className="md:col-span-5">
              <div className="sticky top-28">
                <div className="uppercase text-cyan-400 text-sm tracking-[2px] mb-3">QUEM SOMOS</div>
                <h2 className="text-5xl font-semibold tracking-tight leading-none mb-8">
                  Física aplicada.<br/>Resultados reais.
                </h2>
                <div className="h-px w-16 bg-cyan-400 mb-8"></div>
                <p className="text-lg text-zinc-400 max-w-sm">
                  Somos uma empresa júnior da Universidade de Brasília especializada em soluções baseadas em física e modelagem computacional.
                </p>
              </div>
            </div>

            <div className="md:col-span-7 space-y-8">
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                <div className="flex items-start gap-6">
                  <div className="text-4xl">⚛️</div>
                  <div>
                    <div className="text-cyan-400 font-mono text-xs mb-1">MISSÃO</div>
                    <p className="text-zinc-300">Transformar desafios complexos em soluções acessíveis através de modelagem matemática, simulações e análise de dados.</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                  <div className="text-5xl mb-6">🔬</div>
                  <h4 className="font-semibold text-xl mb-2">Ciência Aplicada</h4>
                  <p className="text-sm text-zinc-400">Desenvolvemos modelos físicos e simulações personalizadas para pesquisa e indústria.</p>
                </div>
                
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                  <div className="text-5xl mb-6">📈</div>
                  <h4 className="font-semibold text-xl mb-2">Otimização</h4>
                  <p className="text-sm text-zinc-400">Utilizamos ferramentas de ML e algoritmos para resolver problemas do mundo real.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="relative z-10 py-24 border-t border-b border-white/5 bg-zinc-900">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="uppercase text-xs tracking-widest text-violet-400 mb-3">NOSSO TRABALHO</div>
            <h2 className="text-6xl font-semibold tracking-tighter">Portfólio</h2>
            <p className="mt-4 max-w-md text-zinc-400">Projetos que combinam física, matemática e tecnologia para resolver problemas reais</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {portfolioItems.map((item, index) => (
              <div 
                key={item.id}
                className="group bg-zinc-950 border border-white/10 hover:border-cyan-400/60 transition-all duration-500 rounded-3xl p-8 flex flex-col"
              >
                <div className="text-6xl mb-8 opacity-75 group-hover:opacity-90 transition-opacity">{item.icon}</div>
                
                <h3 className="text-2xl font-semibold mb-6 leading-tight tracking-tight">{item.title}</h3>
                
                <div className="space-y-8 flex-1">
                  <div>
                    <div className="uppercase text-[10px] text-rose-300 tracking-widest mb-2">DESAFIO</div>
                    <p className="text-zinc-400 text-[15px] leading-relaxed">{item.challenge}</p>
                  </div>
                  
                  <div>
                    <div className="uppercase text-[10px] text-cyan-300 tracking-widest mb-2">SOLUÇÃO</div>
                    <p className="text-zinc-400 text-[15px] leading-relaxed">{item.solution}</p>
                  </div>
                  
                  <div>
                    <div className="uppercase text-[10px] text-emerald-300 tracking-widest mb-2">RESULTADO</div>
                    <p className="text-zinc-400 text-[15px] leading-relaxed">{item.result}</p>
                  </div>
                </div>
                
                <div className="pt-8 mt-auto border-t border-white/10 text-xs text-cyan-400 flex items-center gap-2">
                  PROJETO #{String(index+1).padStart(2, '0')}
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-emerald-400">✓ CONCLUÍDO</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES / VALUES */}
      <section className="relative z-10 py-24 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 border border-white/10 rounded-3xl">
              <div className="text-cyan-400 text-7xl mb-6">01</div>
              <h3 className="text-3xl font-medium mb-4">Modelagem Matemática</h3>
              <p className="text-zinc-400">Criação de equações e simulações que representam fenômenos físicos e biológicos complexos.</p>
            </div>
            
            <div className="p-10 border border-white/10 rounded-3xl">
              <div className="text-cyan-400 text-7xl mb-6">02</div>
              <h3 className="text-3xl font-medium mb-4">Análise de Dados</h3>
              <p className="text-zinc-400">Utilizamos Python, Machine Learning e ferramentas de visualização para extrair insights.</p>
            </div>
            
            <div className="p-10 border border-white/10 rounded-3xl">
              <div className="text-cyan-400 text-7xl mb-6">03</div>
              <h3 className="text-3xl font-medium mb-4">Soluções Personalizadas</h3>
              <p className="text-zinc-400">Desenvolvemos ferramentas e planilhas sob medida para otimizar processos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="relative z-10 py-28 bg-zinc-900 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <div className="inline text-xs px-4 py-2 rounded-full bg-white/5 border border-white/20">Vamos conversar sobre seu projeto?</div>
            <h2 className="text-6xl font-semibold tracking-tighter mt-6">Entre em contato</h2>
          </div>

          <div className="max-w-lg mx-auto bg-zinc-950 border border-white/10 p-10 rounded-3xl">
            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); alert('Mensagem enviada com sucesso! (Simulação)'); }}>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2 text-zinc-400">Nome</label>
                <input type="text" className="w-full bg-transparent border-b border-white/30 focus:border-cyan-400 py-3 outline-none text-lg placeholder:text-zinc-500" placeholder="Seu nome" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2 text-zinc-400">Email</label>
                <input type="email" className="w-full bg-transparent border-b border-white/30 focus:border-cyan-400 py-3 outline-none text-lg placeholder:text-zinc-500" placeholder="seu@email.com" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2 text-zinc-400">Mensagem</label>
                <textarea className="w-full bg-transparent border-b border-white/30 focus:border-cyan-400 py-3 outline-none text-lg placeholder:text-zinc-500 h-32 resize-y" placeholder="Descreva seu projeto ou dúvida..."></textarea>
              </div>
              
              <button 
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-semibold rounded-2xl hover:brightness-110 active:scale-[0.985] transition-all text-sm tracking-widest"
              >
                ENVIAR MENSAGEM
              </button>
            </form>
          </div>

          <div className="mt-16 text-center text-xs text-zinc-500">
            Universidade de Brasília • Instituto de Física<br />
            quarkup@unb.br
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/10 text-center text-xs text-zinc-500 bg-black">
        © 2025 Quark Up - Empresa Júnior de Física. Todos os direitos reservados.
      </footer>
    </div>
  );
}
