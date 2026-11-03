// ==========================================
// قاعدة بيانات الأعطال (كما هي)
// ==========================================
const faultDatabase = {
    frost: {
        title: "❄️ صقيع على الأنابيب",
        causes: [
            "نقص في غاز التبريد (أكثر الأسباب شيوعاً).",
            "انسداد في صمام التمدد أو الأنبوب الشعري.",
            "ضعف في تدفق الهواء عبر المبخر (فلتر متسخ)."
        ]
    },
    lowCooling: {
        title: "📉 تبريد ضعيف",
        causes: [
            "تسرب في الغاز أو نقص الشحن.",
            "المكثف (الوحدة الخارجية) متسخ جداً ولا يطرد الحرارة.",
            "الضاغط ضعيف ولا يضغط بشكل كافٍ."
        ]
    },
    highPressure: {
        title: "🌡️ ضغط طرد مرتفع",
        causes: [
            "عدم كفاية تبريد المكثف (مراوح لا تعمل أو زعانف مسدودة).",
            "وجود هواء أو غاز غير قابل للتكثيف داخل الدورة.",
            "شحن زائد للغاز (Overcharge)."
        ]
    },
    compressorOff: {
        title: "🔇 الضاغط لا يعمل",
        causes: [
            "مشكلة في الكهرباء (الكابستور، أوفرلود، أو لوحة التحكم).",
            "ضغط عالي جداً أو منخفض جداً يمنع التشغيل (أجهزة الحماية).",
            "الضاغط تالف (يحتاج قياس مقاومة الملفات)."
        ]
    }
};

document.getElementById('symptomSelect').addEventListener('change', function() {
    const selectedFault = this.value;
    const resultBox = document.getElementById('diagnosisResult');
    
    if (selectedFault && faultDatabase[selectedFault]) {
        const data = faultDatabase[selectedFault];
        let causesHTML = data.causes.map(cause => `<li>${cause}</li>`).join('');
        resultBox.style.display = 'block';
        resultBox.innerHTML = `<h3>${data.title}</h3><p><strong>الأسباب المحتملة:</strong></p><ul>${causesHTML}</ul>`;
    } else {
        resultBox.style.display = 'none';
    }
});


// ==========================================
// جداول ضغوط الغازات (Pressure-Temperature Chart)
// القيم تقريبية للضغط (Bar) مقابل درجة حرارة التشبع (°C)
// ==========================================
const ptCharts = {
    "R410a": [
        {bar: 4.0, temp: -10}, {bar: 5.0, temp: -5}, {bar: 6.0, temp: 0},
        {bar: 7.0, temp: 4}, {bar: 8.0, temp: 8}, {bar: 9.0, temp: 11},
        {bar: 10.0, temp: 15}, {bar: 11.0, temp: 18}, {bar: 12.0, temp: 21},
        {bar: 13.0, temp: 24}, {bar: 14.0, temp: 27}, {bar: 15.0, temp: 29}
    ],
    "R32": [
        {bar: 4.0, temp: -12}, {bar: 5.0, temp: -6}, {bar: 6.0, temp: -1},
        {bar: 7.0, temp: 3}, {bar: 8.0, temp: 7}, {bar: 9.0, temp: 11},
        {bar: 10.0, temp: 14}, {bar: 11.0, temp: 17}, {bar: 12.0, temp: 20},
        {bar: 13.0, temp: 23}, {bar: 14.0, temp: 26}, {bar: 15.0, temp: 28}
    ],
    "R22": [
        {bar: 3.0, temp: -10}, {bar: 4.0, temp: -1}, {bar: 5.0, temp: 5},
        {bar: 6.0, temp: 9}, {bar: 7.0, temp: 13}, {bar: 8.0, temp: 17},
        {bar: 9.0, temp: 20}, {bar: 10.0, temp: 23}, {bar: 11.0, temp: 25},
        {bar: 12.0, temp: 28}, {bar: 13.0, temp: 30}, {bar: 14.0, temp: 32}
    ]
};

// تحويل PSI إلى Bar (1 Bar = 14.5038 PSI)
function psiToBar(psi) {
    return psi / 14.5038;
}

// دالة لإيجاد درجة الحرارة بناءً على الضغط (بحث تقريبي)
function getSatTempFromPressure(gas, pressureBar) {
    const chart = ptCharts[gas];
    
    // إذا كان الضغط أقل من أول قيمة في الجدول
    if (pressureBar <= chart[0].bar) return chart[0].temp;
    // إذا كان الضغط أعلى من آخر قيمة
    if (pressureBar >= chart[chart.length - 1].bar) return chart[chart.length - 1].temp;

    // البحث عن أقرب نقطتين وعمل استقراء خطي (Linear Interpolation)
    for (let i = 0; i < chart.length - 1; i++) {
        if (pressureBar >= chart[i].bar && pressureBar <= chart[i+1].bar) {
            const p1 = chart[i].bar;
            const p2 = chart[i+1].bar;
            const t1 = chart[i].temp;
            const t2 = chart[i+1].temp;
            
            // معادلة الاستقراء الخطي
            const temp = t1 + ((pressureBar - p1) / (p2 - p1)) * (t2 - t1);
            return temp;
        }
    }
    return 0;
}

// دالة الحساب الجديدة
function calculateSuperheatSmart() {
    const gas = document.getElementById('gasType').value;
    let pressure = parseFloat(document.getElementById('pressureValue').value);
    const unit = document.getElementById('pressureUnit').value;
    const suctionTemp = parseFloat(document.getElementById('suctionTemp').value);
    const calcResult = document.getElementById('calcResult');

    // التحقق من المدخلات
    if (isNaN(pressure) || isNaN(suctionTemp)) {
        calcResult.style.display = 'block';
        calcResult.style.borderRight = "5px solid #f59e0b";
        calcResult.innerHTML = "⚠️ يرجى إدخال قيمة الضغط ودرجة الحرارة بشكل صحيح.";
        return;
    }

    // تحويل الوحدة إلى Bar إذا كانت PSI
    if (unit === 'psi') {
        pressure = psiToBar(pressure);
    }

    // حساب درجة حرارة التشبع من الجدول
    const satTemp = getSatTempFromPressure(gas, pressure);
    
    // حساب التحميم
    const superheat = suctionTemp - satTemp;
    
    let status = "";
    let color = "";
    let advice = "";

    // تقييم النتيجة (نطاق 4-12 درجة مئوية هو النطاق الآمن للأنظمة المنزلية)
    if (superheat < 4) {
        status = "⚠️ التحميم منخفض جداً (Superheat Low)";
        color = "#f59e0b"; 
        advice = "قد يكون هناك شحن زائد للغاز، أو صمام التمدد مفتوح كثيراً، أو المبخر مغمور بالهواء البارد.";
    } else if (superheat >= 4 && superheat <= 12) {
        status = "✅ التحميم ممتاز (Normal Superheat)";
        color = "#10b981";
        advice = "النظام يعمل بكفاءة طبيعية، لا توجد مشاكل واضحة في كمية الغاز أو صمام التمدد.";
    } else {
        status = "❌ التحميم مرتفع جداً (Superheat High)";
        color = "#ef4444";
        advice = "قد يكون هناك نقص في الغاز (تسريب)، أو انسداد في صمام التمدد/الأنبوب الشعري، أو ضعف في تدفق الهواء.";
    }

    calcResult.style.display = 'block';
    calcResult.style.borderRight = `5px solid ${color}`;
    calcResult.innerHTML = `
        <p><strong>الغاز:</strong> ${gas} | <strong>الضغط المحول:</strong> ${pressure.toFixed(2)} Bar</p>
        <p><strong>درجة حرارة التشبع (من الجدول):</strong> ${satTemp.toFixed(1)} °C</p>
        <hr style="border-color: #475569; margin: 10px 0;">
        <p><strong>قيمة التحميم:</strong> <span style="font-size:1.2rem; color:${color}; font-weight:bold;">${superheat.toFixed(1)} °C</span></p>
        <p><strong>النتيجة:</strong> ${status}</p>
        <p style="font-size:0.9rem; color:#cbd5e1;">💡 <strong>التوجيه:</strong> ${advice}</p>
    `;
}
