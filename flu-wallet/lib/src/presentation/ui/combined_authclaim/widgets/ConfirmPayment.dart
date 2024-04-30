DropdownButton<String>(hint: const Text("Choose your currency"),
value: currency,
items: const <String>[DAI,USDT].map<DropdownMenuItem<String>>((String v) {
return DropdownMenuItem<String>(
value: v,
child: Text(v),
);
}).toList(),
onChanged: (String? value) {
setState(() {
currency = value ?? "ERROR";
_fetchCoinBalance(value);
});

}),