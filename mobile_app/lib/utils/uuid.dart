import 'dart:math';

String generateUuidV4() {
  final random = Random();
  const hexDigits = '0123456789abcdef';
  
  String randomHex(int length) {
    return List.generate(length, (index) => hexDigits[random.nextInt(16)]).join();
  }
  
  final part1 = randomHex(8);
  final part2 = randomHex(4);
  final part3 = '4${randomHex(3)}';
  final variantChar = ['8', '9', 'a', 'b'][random.nextInt(4)];
  final part4 = '$variantChar${randomHex(3)}';
  final part5 = randomHex(12);
  
  return '$part1-$part2-$part3-$part4-$part5';
}

bool isValidUuid(String id) {
  final regExp = RegExp(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    caseSensitive: false,
  );
  return regExp.hasMatch(id);
}
