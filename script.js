// قاعدة بيانات الأعطال (مستوحاة من المعلومات التقنية)
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

// دالة التشخيص
document.getElementById('symptomSelect').addEventListener('change', function() {
    const selectedFault = this.value;
    const resultBox = document.getElementById('diagnosisResult');
    
    if (selectedFault && faultDatabase[selectedFault]) {
        const data = faultDatabase[selectedFault];
        let causesHTML = data.causes.map(cause => `<li>${cause}</li>`).join('');
        
        resultBox.style.display = 'block';
        resultBox.innerHTML = `
            <h3>${data.title}</h3>
            <p><strong>الأسباب المحتملة:</strong></p>
            <ul>${causesHTML}</ul>
        `;
    } else {
        resultBox.style.display = 'none';
    }
});

// دالة حساب التحميم
function calculateSuperheat() {
    const suctionTemp = parseFloat(document.getElementById('suctionTemp').value);
    const satTemp = parseFloat(document.getElementById('satTemp').value);
    const calcResult = document.getElementById('calcResult');

    if (isNaN(suctionTemp) || isNaN(satTemp)) {
        calcResult.style.display = 'block';
        calcResult.innerHTML = "⚠️ يرجى إدخال أرقام صحيحة في كلا الحقلين.";
        return;
    }

    const superheat = suctionTemp - satTemp;
    let status = "";
    let color = "";

    // تقييم النتيجة (قياسي للأنظمة المنزلية)
    if (superheat < 4) {
        status = "⚠️ التحميم منخفض جداً. قد يكون هناك شحن زائد للغاز أو صمام تمدد مفتوح كثيراً.";
        color = "#f59e0b"; // برتقالي
    } else if (superheat >= 4 && superheat <= 12) {
        status = "✅ التحميم ممتاز. النظام يعمل بكفاءة طبيعية.";
        color = "#10b981"; // أخضر
    } else {
        status = "❌ التحميم مرتفع جداً. قد يكون هناك نقص في الغاز أو انسداد في صمام التمدد أو الأنبوب الشعري.";
        color = "#ef4444"; // أحمر
    }

    calcResult.style.display = 'block';
    calcResult.style.borderRight = `5px solid ${color}`;
    calcResult.innerHTML = `
        <p><strong>قيمة التحميم:</strong> ${superheat.toFixed(1)} °C</p>
        <p>${status}</p>
    `;
}
