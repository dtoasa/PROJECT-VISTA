let imgTempCat = "";
let carouselTimer;
let curSlide = 0;

document.addEventListener('DOMContentLoaded', () => {
    // MENÚ
    const menuBtn = document.getElementById('mobile-menu');
    const navList = document.getElementById('nav-list');
    if (menuBtn) {
        menuBtn.onclick = () => navList.classList.toggle('active');
    }

    // OJO CONTRASEÑA
    const eye = document.getElementById('togglePassword');
    const passInput = document.getElementById('pass-input');
    if (eye && passInput) {
        eye.onclick = () => {
            const type = passInput.type === 'password' ? 'text' : 'password';
            passInput.type = type;
            eye.textContent = type === 'password' ? '👁️' : '🔒';
        };
    }

    // ARRASTRE
    setupDrag('drop-area-dest', files => subirDestacados(files));
    setupDrag('drop-area-cat', files => procesarFotoCatalogo(files));

    // ACCESO
    if (window.location.pathname.includes("galeria.html") && sessionStorage.getItem("auth") === "true") {
        document.getElementById('login-container').style.display = "none";
        document.getElementById('admin-content').style.display = "block";
    }

    render();
});

function setupDrag(id, onDrop) {
    const zone = document.getElementById(id);
    if (!zone) return;
    ['dragover', 'dragleave', 'drop'].forEach(n => {
        zone.addEventListener(n, e => { e.preventDefault(); e.stopPropagation(); });
    });
    zone.addEventListener('drop', e => onDrop(e.dataTransfer.files));
}

window.procesarFotoCatalogo = (files) => {
    if (files[0]) {
        const reader = new FileReader();
        reader.readAsDataURL(files[0]);
        reader.onload = () => {
            imgTempCat = reader.result;
            document.getElementById('cat-status').innerText = "✅ Foto Cargada";
            document.getElementById('cat-status').style.color = "green";
        };
    }
};

window.subirDestacados = (files) => {
    const fotos = JSON.parse(localStorage.getItem('fotos_destacadas')) || [];
    const promises = [...files].map(f => new Promise(res => {
        const r = new FileReader(); r.readAsDataURL(f);
        r.onload = () => { fotos.push(r.result); res(); };
    }));
    Promise.all(promises).then(() => {
        localStorage.setItem('fotos_destacadas', JSON.stringify(fotos));
        render();
    });
};

window.guardarCatalogo = () => {
    const desc = document.getElementById('prod-desc').value;
    const price = document.getElementById('prod-price').value;
    const stock = document.querySelector('input[name="stock"]:checked').value;
    if (!imgTempCat || !desc || !price) return alert("Falta imagen o datos");

    const db = JSON.parse(localStorage.getItem('db_catalogo')) || [];
    db.push({ img: imgTempCat, desc, price, stock });
    localStorage.setItem('db_catalogo', JSON.stringify(db));
    location.reload();
};

window.cambiarStock = (index, nuevo) => {
    const db = JSON.parse(localStorage.getItem('db_catalogo')) || [];
    db[index].stock = nuevo;
    localStorage.setItem('db_catalogo', JSON.stringify(db));
    render();
};

window.borrarD = (i) => { if(confirm("¿Borrar?")){ const f = JSON.parse(localStorage.getItem('fotos_destacadas')); f.splice(i,1); localStorage.setItem('fotos_destacadas', JSON.stringify(f)); render(); }};
window.borrarC = (i) => { if(confirm("¿Borrar?")){ const f = JSON.parse(localStorage.getItem('db_catalogo')); f.splice(i,1); localStorage.setItem('db_catalogo', JSON.stringify(f)); render(); }};

window.validarAcceso = () => {
    if (document.getElementById('pass-input').value === "1234") {
        sessionStorage.setItem("auth", "true");
        location.reload();
    } else { alert("Clave Incorrecta"); }
};

window.logout = () => { sessionStorage.removeItem("auth"); location.reload(); };

function startTimer() {
    clearInterval(carouselTimer);
    carouselTimer = setInterval(() => shift(1), 5000);
}

function shift(d) {
    const f = JSON.parse(localStorage.getItem('fotos_destacadas')) || [];
    const track = document.getElementById('index-gallery');
    if (!track || f.length <= 1) return;
    curSlide = (curSlide + d + f.length) % f.length;
    track.style.transform = `translateX(-${curSlide * 100}%)`;
}

function render() {
    const dest = JSON.parse(localStorage.getItem('fotos_destacadas')) || [];
    const cat = JSON.parse(localStorage.getItem('db_catalogo')) || [];

    const track = document.getElementById('index-gallery');
    if (track && dest.length > 0) {
        track.innerHTML = dest.map(img => `<img src="${img}">`).join('');
        document.getElementById('nextBtn').onclick = () => { shift(1); startTimer(); };
        document.getElementById('prevBtn').onclick = () => { shift(-1); startTimer(); };
        startTimer();
    }

    const list = document.getElementById('product-list');
    if (list) {
        list.innerHTML = cat.map(p => `
            <div class="product-item">
                <img src="${p.img}">
                <div class="product-info">
                    <h3>${p.desc}</h3>
                    <p class="price"><b>${p.price}</b></p>
                    <p style="color:${p.stock==='En Stock'?'#27ae60':'#e74c3c'}">● ${p.stock}</p>
                </div>
            </div>`).join('');
    }

    const adDest = document.getElementById('admin-destacados');
    if (adDest) adDest.innerHTML = dest.map((img, i) => `<div class="img-card"><img src="${img}"><button class="delete-btn" onclick="borrarD(${i})">×</button></div>`).join('');
    
    const adCat = document.getElementById('admin-catalogo');
    if (adCat) adCat.innerHTML = cat.map((p, i) => `
        <div class="img-card">
            <img src="${p.img}">
            <button class="delete-btn" onclick="borrarC(${i})">×</button>
            <div class="stock-toggle">
                <button class="btn-s ${p.stock==='En Stock'?'active':''}" onclick="cambiarStock(${i}, 'En Stock')">S</button>
                <button class="btn-a ${p.stock==='Agotado'?'active':''}" onclick="cambiarStock(${i}, 'Agotado')">A</button>
            </div>
        </div>`).join('');
}