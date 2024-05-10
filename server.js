const express = require('express');
const pdf = require('html-pdf');
const bodyParser = require('body-parser');
const path = require('path');
const handlebars = require('handlebars');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Read template file
const templateHtml = fs.readFileSync(path.join(__dirname, 'public', 'template.html'), 'utf-8');
const template = handlebars.compile(templateHtml);
app.post('/generate-pdf', (req, res) => {
    // Ensure all arrays have the same length as productName
    const productNameLength = req.body.productName.length;
    const paddedArrays = ['sr_no', 'sacNo', 'unit', 'quantity', 'rate', 'amount'].reduce((acc, key) => {
        const arr = req.body[key] || []; // If the array is not present, use an empty array
        acc[key] = arr.length < productNameLength ? arr.concat(Array(productNameLength - arr.length).fill('')) : arr;
        return acc;
    }, {});
// Multiply grandTotal by 0.09 and round to 2 decimal points

console.log(req.body.grand_total);
const tax = (req.body.grand_total * 0.09).toFixed(4);
console.log(tax);

// Multiply tax by 2 (assuming this is the tax amount)
const tax_amt = (tax * 2).toFixed(4);
console.log(tax_amt);

// Add grandTotal, tax, and tax_amt to get the total amount after tax
const after_tax = (parseFloat(req.body.grand_total) + parseFloat(tax_amt)).toFixed(4);
const amountInWords = convertToWords(after_tax);
console.log(amountInWords); 
console.log(after_tax);
    // Compile data into HTML using Handlebars
    const html = template({
        invoiceNo: req.body.invoice_no,
        invoiceDate: req.body.invoice_date,
        workNo: req.body.work_order_number,
        workDate: req.body.work_date,
        customerName: req.body.cname,
        customerAddress: req.body.caddress,
        customerGSTIN: req.body.cgst,
        customerState: req.body.cstate,
        customerHSN: req.body.chsn,
        customerPAN: req.body.cpan,
        siteName: req.body.site_name,
        siteAddress: req.body.site_address,
        products: req.body.productName.map((productName, index) => ({
            srNo: paddedArrays.sr_no[index],
            description: productName,
            sacNo: paddedArrays.sacNo[index],
            unit: paddedArrays.unit[index],
            quantity: paddedArrays.quantity[index],
            rate: paddedArrays.rate[index],
            amount: paddedArrays.amount[index]
        })),
        grandTotal: req.body.grand_total,
        tax: tax,
        tax_amt: tax_amt,
        after_tax: after_tax,
        amountInWords : amountInWords
    });
    //PDF from HTML Madhe convert karte
    pdf.create(html).toBuffer((err, buffer) => {
        if (err) {
            console.error(err);
            return res.send('PDF generation error');
        }
        res.setHeader('Content-Type', 'application/pdf');
        
        var ino = req.body.invoice_no;
        var filename = ino + "_SDCLLP" + ".pdf";
        res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
        res.send(buffer);
        
        console.log("------------------=====---------------")
        console.log("Invoice generated with name" + filename);
        console.log("------------------👌😉---------------")

    });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
// Code by - Vedant Mute 
function convertToWords(amount) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
              'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertLessThanOneThousand(n) {
        if (n < 20) {
            return ones[n];
        }
        if (n < 100) {
            return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        }
        return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
    }

    function convert(amount) {
        if (amount === 0) {
            return 'zero';
        }
        let words = '';
        if (amount >= 10000000) {
            words += convertLessThanOneThousand(Math.floor(amount / 10000000)) + ' crore ';
            amount %= 10000000;
        }
        if (amount >= 100000) {
            words += convertLessThanOneThousand(Math.floor(amount / 100000)) + ' lakh ';
            amount %= 100000;
        }
        if (amount >= 1000) {
            words += convertLessThanOneThousand(Math.floor(amount / 1000)) + ' thousand ';
            amount %= 1000;
        }
        if (amount > 0) {
            words += convertLessThanOneThousand(amount);
        }
        return words.trim();
    }

    function convertDecimal(decimal) {
        if (decimal === 0) {
            return '';
        }
        const decimalLength = decimal.toString().length;
        const paddedDecimal = decimal.toString().padEnd(4, '0'); // Pad with zeros to ensure four decimal points
        const firstTwoDigits = parseInt(paddedDecimal.substring(0, 2));
        const lastTwoDigits = parseInt(paddedDecimal.substring(2));
        let result = '';
        if (firstTwoDigits > 0) {
            result += tens[Math.floor(firstTwoDigits / 10)] + ' ' + ones[firstTwoDigits % 10];
        }
        if (lastTwoDigits > 0) {
            result += ' and ' + tens[Math.floor(lastTwoDigits / 10)] + ' ' + ones[lastTwoDigits % 10];
        }
        return result.trim();
    }

    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 10000); // Multiply by 10000 for four decimal points

    let result = convert(integerPart);
    result += ' Rupees';
    if (decimalPart > 0) {
        result += ' and ' + convertDecimal(decimalPart) + ' Paise';
    }

    return result;
}


