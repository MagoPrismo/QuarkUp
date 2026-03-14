import React from "react";

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [expandedPortfolio, setExpandedPortfolio] = React.useState<number | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const particlesRef = React.useRef<any[]>([]);
  const mouseRef = React.useRef({ x: 0, y: 0, isPressed: false });
  const animationRef = React.useRef<number | null>(null);
  const explosionTimesRef = React.useRef<number[]>([]);

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
      // Limit explosions to twice at a time
      const now = Date.now();
      explosionTimesRef.current = explosionTimesRef.current.filter(time => now - time < 800);
      if (explosionTimesRef.current.length >= 2) return;
      explosionTimesRef.current.push(now);

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
        className="fixed inset-0 z-0 pointer-events-auto cursor-default"
        style={{ background: 'radial-gradient(circle at center, #18181b 0%, #09090b 70%)' }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center">
              <img 
                src="https://res.cloudinary.com/dlv8yppuo/image/upload/v1773505256/Design_sem_nome_24_elywh4.png" 
                alt="Quark Up Logo" 
                className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.7)] cursor-pointer"
                onClick={() => scrollToSection('inicio')}
              />
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tighter">QUARK UP</div>
              <div className="text-[10px] text-cyan-400 -mt-1 tracking-[2px]">FÍSICA JR</div>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10 text-sm uppercase tracking-widest font-medium">
            <button onClick={() => scrollToSection('inicio')} className="hover:text-cyan-400 transition-colors cursor-pointer">INÍCIO</button>
            <button onClick={() => scrollToSection('sobre')} className="hover:text-cyan-400 transition-colors cursor-pointer">SOBRE</button>
            <button onClick={() => scrollToSection('portfolio')} className="hover:text-cyan-400 transition-colors cursor-pointer">PORTFÓLIO</button>
            <button onClick={() => scrollToSection('contato')} className="hover:text-cyan-400 transition-colors cursor-pointer">CONTATO</button>
            <button onClick={() => scrollToSection('membros')} className="hover:text-cyan-400 transition-colors cursor-pointer">MEMBROS</button>
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
              <button onClick={() => scrollToSection('inicio')} className="hover:text-cyan-400 cursor-pointer">Início</button>
              <button onClick={() => scrollToSection('sobre')} className="hover:text-cyan-400 cursor-pointer">Sobre</button>
              <button onClick={() => scrollToSection('portfolio')} className="hover:text-cyan-400 cursor-pointer">Portfólio</button>
              <button onClick={() => scrollToSection('contato')} className="hover:text-cyan-400 cursor-pointer">Contato</button>
              <button onClick={() => scrollToSection('membros')} className="hover:text-cyan-400 cursor-pointer">Membros</button>
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
              className="px-10 py-4 cursor-pointer bg-white text-zinc-950 font-semibold rounded-2xl hover:bg-cyan-300 transition-all active:scale-[0.985] flex items-center justify-center gap-3 group"
            >
              VER PROJETOS 
              <span className="text-lg group-active:rotate-45 transition">→</span>
            </button>
            
            <button 
              onClick={() => scrollToSection('contato')}
              className="px-10 py-4 cursor-pointer border border-white/30 hover:border-white/70 font-medium rounded-2xl transition-all"
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
      <section id="portfolio" className="relative z-10 py-24 border-t border-b border-white/5 bg-black">
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
                onClick={() => setExpandedPortfolio(item.id)}
                className="group bg-zinc-950 border border-white/10 hover:border-cyan-400/60 transition-all duration-500 rounded-3xl p-8 flex flex-col cursor-pointer hover:shadow-lg hover:shadow-cyan-900/10"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="text-6xl opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">{item.icon}</div>
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center transition-transform duration-500 group-hover:bg-white/10">
                    <span className="text-white text-sm">↗</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-semibold mb-2 leading-tight tracking-tight">{item.title}</h3>
                <p className="text-zinc-500 line-clamp-2 mt-4 text-sm">{item.challenge}</p>
                
                <div className="pt-6 mt-auto border-t border-white/10 text-xs flex items-center gap-2 transition-all mt-6">
                  <span className="text-zinc-500 font-mono">PROJETO #{String(index+1).padStart(2, '0')}</span>
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                    VER RESULTADO
                  </span>
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
                className="w-full py-4 bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-semibold rounded-2xl hover:brightness-110 active:scale-[0.985] transition-all text-sm tracking-widest cursor-pointer"
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

      {/* MEMBROS */}
      <section id="membros" className="relative z-10 py-24 bg-zinc-900 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="uppercase text-xs tracking-widest text-emerald-400 mb-3">NOSSA EQUIPE</div>
            <h2 className="text-6xl font-semibold tracking-tighter">Membros</h2>
            <p className="mt-4 max-w-md text-zinc-400">Pessoas trabalhando juntas pelo desenvolvimento de soluções disruptivas</p>
          </div>

          <div className="flex flex-col items-center gap-16">
            {/* Presidente */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <img 
                  src="https://res.cloudinary.com/dlv8yppuo/image/upload/v1773505847/WhatsApp_Image_2026-02-21_at_17.44.54_whbu5w.jpg" 
                  alt="Giovany Medeiros"
                  className="w-full h-full object-cover object-top hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div>
                <h3 className="text-2xl font-medium tracking-tight">Giovany Medeiros</h3>
                <p className="text-cyan-400 tracking-wider text-xs mt-1.5 font-bold uppercase">Presidente da Quark Up</p>
              </div>
            </div>

            {/* Equipe Completa */}
            <div className="w-full max-w-4xl bg-zinc-950/50 rounded-3xl overflow-hidden border border-white/10 mt-4 backdrop-blur-md relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none"></div>
              <div className="aspect-[16/10] md:aspect-[21/9] w-full relative">
                <img 
                  src="https://res.cloudinary.com/dlv8yppuo/image/upload/v1773506011/Gemini_Generated_Image_okbe68okbe68okbe_hde1ia.png" 
                  alt="Equipe Quark Up"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                />
              </div>
              <div className="p-8 md:p-14 relative z-20 -mt-16 md:-mt-24">
                <h3 className="text-3xl md:text-4xl font-semibold mb-6 text-white tracking-tight drop-shadow-md">Sobre a Empresa e a UnB</h3>
                <div className="space-y-4 text-zinc-300 md:text-lg font-light leading-relaxed drop-shadow-sm max-w-3xl">
                  <p>
                    A Quark Up é a Empresa Júnior de Física da Universidade de Brasília (UnB). Somos formados por estudantes apaixonados por ciência, tecnologia e inovação, aplicando os amplos conhecimentos adquiridos ao longo da graduação para entregar soluções excepcionais e com base técnica sólida para o mercado.
                  </p>
                  <p>
                    Com o respaldo acadêmico inestimável de professores e pesquisadores de ponta da UnB, garantimos precisão técnica, rigor metodológico e a mesma excelência presente em nossos laboratórios, impulsionando a ciência que faz a valer a pena na vida real.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 border-t border-white/10 bg-black">
        <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center">
              <img 
                src="https://res.cloudinary.com/dlv8yppuo/image/upload/v1773505256/Design_sem_nome_24_elywh4.png" 
                alt="Quark Up Logo" 
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
              />
            </div>
            <span className="text-sm text-zinc-400 font-medium">© 2026 Quark Up. Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://www.instagram.com/quarkupp/" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            
            <div className="h-6 w-px bg-white/20 hidden md:block"></div>

            <img 
              src="https://res.cloudinary.com/dlv8yppuo/image/upload/v1773507355/Webysther_20160322_-_Logo_UnB__sem_texto_xhr7az.svg" 
              alt="UnB Logo" 
              className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </footer>

      {/* Portfolio Modal */}
      {expandedPortfolio && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setExpandedPortfolio(null)}
          />
          <div className="relative bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-900/20">
            {portfolioItems.map((item) => {
              if (item.id !== expandedPortfolio) return null;
              return (
                <div key={item.id} className="p-8 md:p-12">
                  <div className="flex justify-between items-start mb-8">
                    <div className="text-6xl">{item.icon}</div>
                    <button 
                      onClick={() => setExpandedPortfolio(null)}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-500/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-bold mb-8 leading-tight tracking-tight">{item.title}</h3>
                  
                  <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span> Desafio
                      </div>
                      <p className="text-zinc-300 text-[15px] leading-relaxed">{item.challenge}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span> Solução
                      </div>
                      <p className="text-zinc-300 text-[15px] leading-relaxed">{item.solution}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Resultado
                      </div>
                      <p className="text-zinc-300 text-[15px] leading-relaxed">{item.result}</p>
                    </div>
                  </div>
                  
                  <div className="mt-12 pt-8 border-t border-white/10 text-right">
                    <button 
                      onClick={() => setExpandedPortfolio(null)}
                      className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-sm font-medium transition-all cursor-pointer"
                    >
                      Voltar ao Portfólio
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
