## [0.9.120](https://github.com/Hufe921/canvas-editor/compare/v0.9.119...v0.9.120) (2025-11-28)


### Bug Fixes

* correct line offset calculation for full-line whitespace #1313 ([11365c9](https://github.com/Hufe921/canvas-editor/commit/11365c994d7f7c7c13175ae73809530b227f9579)), closes [#1313](https://github.com/Hufe921/canvas-editor/issues/1313)
* deletion error inside editable select control #1310 ([c6228f1](https://github.com/Hufe921/canvas-editor/commit/c6228f1e229d81f1061ea071b4bc575dfaa695a4)), closes [#1310](https://github.com/Hufe921/canvas-editor/issues/1310)


### Features

* add config to disable background in print mode #1314 ([7d05596](https://github.com/Hufe921/canvas-editor/commit/7d05596cb2889728ec61ba29635f3d3862093074)), closes [#1314](https://github.com/Hufe921/canvas-editor/issues/1314)
* add ignore case option for search #1316 ([32d3ef4](https://github.com/Hufe921/canvas-editor/commit/32d3ef4acab9965b32423cf2009693a5873ec734)), closes [#1316](https://github.com/Hufe921/canvas-editor/issues/1316)
* add ignoreContextKeys option in executeInsertElementList api #1311 ([f09c25c](https://github.com/Hufe921/canvas-editor/commit/f09c25cf9a0a6400f649b3a9c1a57445312d04a7)), closes [#1311](https://github.com/Hufe921/canvas-editor/issues/1311)
* add regex support for search #1308 ([5952a2b](https://github.com/Hufe921/canvas-editor/commit/5952a2b1dcbb10118bac5bb73de5244045db7584)), closes [#1308](https://github.com/Hufe921/canvas-editor/issues/1308)
* scroll the cursor into the viewport #1292 ([bc72039](https://github.com/Hufe921/canvas-editor/commit/bc72039d9a146e7d47d44e0c8fb735173e807a9a)), closes [#1292](https://github.com/Hufe921/canvas-editor/issues/1292)



## [0.9.119](https://github.com/Hufe921/canvas-editor/compare/v0.9.118...v0.9.119) (2025-11-07)


### Bug Fixes

* table rendering error caused by page break #1298 ([cc7ff9e](https://github.com/Hufe921/canvas-editor/commit/cc7ff9e578b7d49da61b6bcbc2b36be733adbb70)), closes [#1298](https://github.com/Hufe921/canvas-editor/issues/1298)


### Features

* add jump to next/previous control api ([7a346a9](https://github.com/Hufe921/canvas-editor/commit/7a346a90f4b75cf12e2a8b725bf7d13526fb8213))
* add version number to the instance ([a6c779b](https://github.com/Hufe921/canvas-editor/commit/a6c779b3cf38c49901709bfb739a17a3546fb7fc))
* enable format painter for single word with no selection #1300 ([bc293a0](https://github.com/Hufe921/canvas-editor/commit/bc293a0bb90c555870c6dd278396d1f1f157f74a)), closes [#1300](https://github.com/Hufe921/canvas-editor/issues/1300)
* optimize the export style of the getHTML api #1294 ([cc106d3](https://github.com/Hufe921/canvas-editor/commit/cc106d38175ff14faf9bac255ebec5e60e54ebcc)), closes [#1294](https://github.com/Hufe921/canvas-editor/issues/1294)
* select entire table when cursor is inside cell #1305 ([b2c07b9](https://github.com/Hufe921/canvas-editor/commit/b2c07b9e558245c5c6eac8a81675557ca9ff5fc6)), closes [#1305](https://github.com/Hufe921/canvas-editor/issues/1305)
* triple-click to select all content in the control #1293 ([51096f6](https://github.com/Hufe921/canvas-editor/commit/51096f6820b3ae258d502c18cebc3455f97e7b4b)), closes [#1293](https://github.com/Hufe921/canvas-editor/issues/1293)



## [0.9.118](https://github.com/Hufe921/canvas-editor/compare/v0.9.117...v0.9.118) (2025-10-17)


### Bug Fixes

* character typesetting boundary error #1280 ([798d555](https://github.com/Hufe921/canvas-editor/commit/798d5555fe6eca4870bffbcf951d835c61302a6f)), closes [#1280](https://github.com/Hufe921/canvas-editor/issues/1280)
* disabling the header and footer through the api is ineffective #1278 ([7f87a6e](https://github.com/Hufe921/canvas-editor/commit/7f87a6ec08cb7a68ee36ff344e1273861c642196)), closes [#1278](https://github.com/Hufe921/canvas-editor/issues/1278)
* executeHyperlink api is missing some attributes #1282 ([beacfbd](https://github.com/Hufe921/canvas-editor/commit/beacfbdfed8add88e7358360d372ae2ba25141a6)), closes [#1282](https://github.com/Hufe921/canvas-editor/issues/1282)
* handle line breaks in clipboard comparison #1275 ([1537cb6](https://github.com/Hufe921/canvas-editor/commit/1537cb66893b3e7a04a6e56cbdea2778da992182)), closes [#1275](https://github.com/Hufe921/canvas-editor/issues/1275)


### Documentation

* update command-execute.md #1277 ([bc76acd](https://github.com/Hufe921/canvas-editor/commit/bc76acd4776399e6432e6dbc9de241f42b8fbe56)), closes [#1277](https://github.com/Hufe921/canvas-editor/issues/1277)


### Features

* improve date formatting ([3eca535](https://github.com/Hufe921/canvas-editor/commit/3eca53581f92d93909b70901cf0ea2d9e14f2938))
* make clipboard operations async for consistency #1276 ([ce4eb10](https://github.com/Hufe921/canvas-editor/commit/ce4eb107987c1b00717f3aea6465aca7b47fa15c)), closes [#1276](https://github.com/Hufe921/canvas-editor/issues/1276)
* number control reject non-numeric input #925 ([8c6b6ce](https://github.com/Hufe921/canvas-editor/commit/8c6b6cebe8e52d285546ae08536685d0f085adff)), closes [#925](https://github.com/Hufe921/canvas-editor/issues/925)



## [0.9.117](https://github.com/Hufe921/canvas-editor/compare/v0.9.116...v0.9.117) (2025-09-27)


### Bug Fixes

* missing some attributes in addWatermark api #1267 ([04b024a](https://github.com/Hufe921/canvas-editor/commit/04b024ad2a9c9b1a633574dac08074e1f4a795f7)), closes [#1267](https://github.com/Hufe921/canvas-editor/issues/1267)
* punctuation width calculation error #1269 ([d545cae](https://github.com/Hufe921/canvas-editor/commit/d545caed43ff5cf83c314129ff4d710e5a7e8599)), closes [#1269](https://github.com/Hufe921/canvas-editor/issues/1269)


### Features

* add groupId option to control element #1259 ([4ee36f5](https://github.com/Hufe921/canvas-editor/commit/4ee36f558700dcb33ee73bd813e8ee1375192e62)), closes [#1259](https://github.com/Hufe921/canvas-editor/issues/1259)
* add scaling function to block element #1184 ([782f52a](https://github.com/Hufe921/canvas-editor/commit/782f52a86054a10144c59959ab5b0da9cb2e18b2)), closes [#1184](https://github.com/Hufe921/canvas-editor/issues/1184)
* optimize double-click selection at start of line #1214 ([19a6336](https://github.com/Hufe921/canvas-editor/commit/19a6336cd52a7cd877b00e9537a146389789093a)), closes [#1214](https://github.com/Hufe921/canvas-editor/issues/1214)
* support printing video block element #1265 ([e113f14](https://github.com/Hufe921/canvas-editor/commit/e113f14f396d9558aedd10c4dec48e48b8eb51b9)), closes [#1265](https://github.com/Hufe921/canvas-editor/issues/1265)
* table can exceed the main text boundary option #1232 ([160df59](https://github.com/Hufe921/canvas-editor/commit/160df59935a171cb1053c9979db4940963b89d4b)), closes [#1232](https://github.com/Hufe921/canvas-editor/issues/1232)



## [0.9.116](https://github.com/Hufe921/canvas-editor/compare/v0.9.115...v0.9.116) (2025-09-07)


### Bug Fixes

* adjust the priority of default style settings #1248 ([c2e4413](https://github.com/Hufe921/canvas-editor/commit/c2e4413d237dcc93b079cb6ef6be8201df6d68ea)), closes [#1248](https://github.com/Hufe921/canvas-editor/issues/1248)
* repeated input in firefox browser using input method #1244 ([2fcb595](https://github.com/Hufe921/canvas-editor/commit/2fcb595bcf2e510e2da6540b9764207104642586)), closes [#1244](https://github.com/Hufe921/canvas-editor/issues/1244)
* use executeSetHTML to set the table row height #1251 ([60c530c](https://github.com/Hufe921/canvas-editor/commit/60c530c43c9cc6882f55c88c2fb320d4b51757bb)), closes [#1251](https://github.com/Hufe921/canvas-editor/issues/1251)


### Chores

* update README.md ([1a68612](https://github.com/Hufe921/canvas-editor/commit/1a686125f23c3ba79049abaad8e4e68bff0f5bd6))
* update tsconfig.json ([f650a32](https://github.com/Hufe921/canvas-editor/commit/f650a3201d33b8dcb74f7e0c6fc0f3c9adb0007a))


### Features

* add executeSetAreaValue api #1243 ([a1d49a5](https://github.com/Hufe921/canvas-editor/commit/a1d49a5f7d820e7012e29fbb548571089ebb2e2f)), closes [#1243](https://github.com/Hufe921/canvas-editor/issues/1243)
* optimize empty lines using executeSetHTML #1252 ([ae2f4c9](https://github.com/Hufe921/canvas-editor/commit/ae2f4c9213e807c77c9494311c0ba33691859c49)), closes [#1252](https://github.com/Hufe921/canvas-editor/issues/1252)



## [0.9.115](https://github.com/Hufe921/canvas-editor/compare/v0.9.114...v0.9.115) (2025-08-23)


### Bug Fixes

*  fix: table width and alignment issue when using getHTML and setHTML #991 ([79941a1](https://github.com/Hufe921/canvas-editor/commit/79941a17a5c0bb6e4df5a8dff6701ec421c643b6)), closes [#991](https://github.com/Hufe921/canvas-editor/issues/991)
* surrounding image rendering error when scaling the page ([aab4615](https://github.com/Hufe921/canvas-editor/commit/aab4615f36ade98fd77b5a1b0b0dd0d7dcf84657))


### Features

* add element hide option #1194 ([5b8f714](https://github.com/Hufe921/canvas-editor/commit/5b8f7149db9cf7cd3ef8cf95c6ead053fd8102bf)), closes [#1194](https://github.com/Hufe921/canvas-editor/issues/1194)
* allow replacing search results with empty string #1222 ([da687db](https://github.com/Hufe921/canvas-editor/commit/da687db6a17f5f02d902bfb0c5fe0c7f4800f8b5)), closes [#1222](https://github.com/Hufe921/canvas-editor/issues/1222)
* executeInsertArea api support inserting by range #1223 ([8d39bb1](https://github.com/Hufe921/canvas-editor/commit/8d39bb1c0ee650af775aa3072c189bc68dc0bb0f)), closes [#1223](https://github.com/Hufe921/canvas-editor/issues/1223)
* optimization of positioning outside the area #1212 ([7cd7bc7](https://github.com/Hufe921/canvas-editor/commit/7cd7bc7ab2d5249e13a2cccf336e3fefc2fafa93)), closes [#1212](https://github.com/Hufe921/canvas-editor/issues/1212)
* the getCatalog and locationCatalog api support within table #1216 ([ba5884c](https://github.com/Hufe921/canvas-editor/commit/ba5884c5665bea283d9ababdfb12802d3d2e5c8e)), closes [#1216](https://github.com/Hufe921/canvas-editor/issues/1216)



## [0.9.114](https://github.com/Hufe921/canvas-editor/compare/v0.9.113...v0.9.114) (2025-08-08)


### Bug Fixes

* composition error while using input method editor #1193 ([87e7394](https://github.com/Hufe921/canvas-editor/commit/87e739455898d2c99485aa8621af26c02269b6be)), closes [#1193](https://github.com/Hufe921/canvas-editor/issues/1193)
* update position context when selecting table cells #1211 ([602896a](https://github.com/Hufe921/canvas-editor/commit/602896adb8989ca5f0a0f91441a90926307a7bb0)), closes [#1211](https://github.com/Hufe921/canvas-editor/issues/1211)


### Features

* add extension option to executeImage api #1201 ([5845843](https://github.com/Hufe921/canvas-editor/commit/5845843e4bee5214745a5f93dcf392db21cbba20)), closes [#1201](https://github.com/Hufe921/canvas-editor/issues/1201)
* add location option to executeLocationArea api #1180 ([f6eff67](https://github.com/Hufe921/canvas-editor/commit/f6eff67e99e6472e065a60cecc5fb9091e8ac7cf)), closes [#1180](https://github.com/Hufe921/canvas-editor/issues/1180)



## [0.9.113](https://github.com/Hufe921/canvas-editor/compare/v0.9.112...v0.9.113) (2025-07-12)


### Bug Fixes

* block element rendering position ([5e2184e](https://github.com/Hufe921/canvas-editor/commit/5e2184eda2325cd318dfd9f569ff9de68aea6596))
* checkbox cannot be selected after indentation of the list #1186 ([ab170d8](https://github.com/Hufe921/canvas-editor/commit/ab170d85747f9ee4e362fca8998a7df396165007)), closes [#1186](https://github.com/Hufe921/canvas-editor/issues/1186)


### Features

* add previous/next navigation to image preview #1173 ([cd42f79](https://github.com/Hufe921/canvas-editor/commit/cd42f790a90bbc7880759f0b1e99a4f86476e5da)), closes [#1173](https://github.com/Hufe921/canvas-editor/issues/1173)
* add shortcutDisableKeys option #1167 ([d72f6b2](https://github.com/Hufe921/canvas-editor/commit/d72f6b27550d6b14c11f675fdb78b8a8a7325e9b)), closes [#1167](https://github.com/Hufe921/canvas-editor/issues/1167)
* alpha option when header and footer are inactive #1164 ([1be6a99](https://github.com/Hufe921/canvas-editor/commit/1be6a99495c47c9ac58841a2c3d7efd572bdbdd1)), closes [#1164](https://github.com/Hufe921/canvas-editor/issues/1164)
* not activate control when selection exists #1189 ([5819e28](https://github.com/Hufe921/canvas-editor/commit/5819e2860ff386a382cbbbfbf6c47bf9d187eed3)), closes [#1189](https://github.com/Hufe921/canvas-editor/issues/1189)



## [0.9.112](https://github.com/Hufe921/canvas-editor/compare/v0.9.111...v0.9.112) (2025-06-20)


### Chores

* add mouse event spell check words ([c901437](https://github.com/Hufe921/canvas-editor/commit/c9014371ac2e6e6e9bb3ef66a40c9a3fe7616bc3))


### Features

* add highlight margin height option #1161 ([7e552a6](https://github.com/Hufe921/canvas-editor/commit/7e552a655e1b4a64d14be5c09b42b4278bff0011)), closes [#1161](https://github.com/Hufe921/canvas-editor/issues/1161)
* add image mousedown event #1160 ([b13f483](https://github.com/Hufe921/canvas-editor/commit/b13f4837b4fc0b6e5ab52493cddf7e8d39608d54)), closes [#1160](https://github.com/Hufe921/canvas-editor/issues/1160)
* add input event listener #1156 ([9b7d13a](https://github.com/Hufe921/canvas-editor/commit/9b7d13af54fc5c7cb2e24162421aa7e60e0d4c7d)), closes [#1156](https://github.com/Hufe921/canvas-editor/issues/1156)
* set locale option and api #1159 ([c1f154a](https://github.com/Hufe921/canvas-editor/commit/c1f154a616bc739724d26d2e3f60d337fe123045)), closes [#1159](https://github.com/Hufe921/canvas-editor/issues/1159)
* watermark supports image format #1043 ([99e982a](https://github.com/Hufe921/canvas-editor/commit/99e982a56f3b9cc3996cf74b48d0de3e127a487e)), closes [#1043](https://github.com/Hufe921/canvas-editor/issues/1043)



## [0.9.111](https://github.com/Hufe921/canvas-editor/compare/v0.9.110...v0.9.111) (2025-06-06)


### Bug Fixes

* control activation and deactivation trigger points #1125 ([ed64e9b](https://github.com/Hufe921/canvas-editor/commit/ed64e9b4574573d8520956ce1838ae85170bc8cb)), closes [#1125](https://github.com/Hufe921/canvas-editor/issues/1125)
* format area element  boundary error #1147 ([facf277](https://github.com/Hufe921/canvas-editor/commit/facf277935988b458005a9e776a49ffb937f0d01)), closes [#1147](https://github.com/Hufe921/canvas-editor/issues/1147)


### Chores

* add row and col position display ([ff230df](https://github.com/Hufe921/canvas-editor/commit/ff230df4f2a00c0198e380c5b4f65abde8c065a8))


### Features

* add col index to getRangeContext api #1150 ([754e87f](https://github.com/Hufe921/canvas-editor/commit/754e87fc76bb53ff7f60808c454aade0b74f6ac0)), closes [#1150](https://github.com/Hufe921/canvas-editor/issues/1150)
* add range option to executeFocus api #1090 ([8b75715](https://github.com/Hufe921/canvas-editor/commit/8b757150c65e7c67bc116f708a8e6087ab1fccb0)), closes [#1090](https://github.com/Hufe921/canvas-editor/issues/1090)
* highlight when control value exists or not #1140 ([cadc530](https://github.com/Hufe921/canvas-editor/commit/cadc530ff9f4d13f3281abfbbc39a4cd5f5da214)), closes [#1140](https://github.com/Hufe921/canvas-editor/issues/1140)



## [0.9.110](https://github.com/Hufe921/canvas-editor/compare/v0.9.109...v0.9.110) (2025-05-23)


### Bug Fixes

* delete pagination table #1130 ([5c1d1da](https://github.com/Hufe921/canvas-editor/commit/5c1d1da58f99f42f620315329e1f2be23ec8c93e)), closes [#1130](https://github.com/Hufe921/canvas-editor/issues/1130)
* floating image position when scaling page #1131 ([0c04243](https://github.com/Hufe921/canvas-editor/commit/0c042436363f261b6f5a1701454de65461d0c165)), closes [#1131](https://github.com/Hufe921/canvas-editor/issues/1131)


### Features

* add area hide option #1139 ([595eb07](https://github.com/Hufe921/canvas-editor/commit/595eb0708d4cf7486d979bfd8b4d4c18482eda1e)), closes [#1139](https://github.com/Hufe921/canvas-editor/issues/1139)
* add form mode rule option #1143 ([99c2838](https://github.com/Hufe921/canvas-editor/commit/99c283835955d43cf71f4f59fb4de392048f347e)), closes [#1143](https://github.com/Hufe921/canvas-editor/issues/1143)
* add group deletable option #1134 ([68da503](https://github.com/Hufe921/canvas-editor/commit/68da503f307c6132c1ba318a370b7a466d80ac19)), closes [#1134](https://github.com/Hufe921/canvas-editor/issues/1134)
* add mode rule option #1132 ([a6c44d4](https://github.com/Hufe921/canvas-editor/commit/a6c44d4265e7dc4aea8dc97e5001f97752cf6c67)), closes [#1132](https://github.com/Hufe921/canvas-editor/issues/1132)
* add rowNo option to executeFocus api #1127 ([603f6fe](https://github.com/Hufe921/canvas-editor/commit/603f6feb9aeb71aeb704fcb3d419457eb6e44ca3)), closes [#1127](https://github.com/Hufe921/canvas-editor/issues/1127)
* set date control value with format #1136 ([2288b66](https://github.com/Hufe921/canvas-editor/commit/2288b663f79ccbe76d6790d8e9f2f5e6b8eea05f)), closes [#1136](https://github.com/Hufe921/canvas-editor/issues/1136)



## [0.9.109](https://github.com/Hufe921/canvas-editor/compare/v0.9.108...v0.9.109) (2025-05-11)


### Bug Fixes

* area mode priority error #1119 ([2abd43a](https://github.com/Hufe921/canvas-editor/commit/2abd43a2a4eb156d154c72a7b709cde6aa433fbd)), closes [#1119](https://github.com/Hufe921/canvas-editor/issues/1119)


### Features

* add controlComponent property to getRangeContext api ([6420421](https://github.com/Hufe921/canvas-editor/commit/6420421e2fd01d79ad5be835eac4f2f49359fec6))
* add disable selection option outside the page #1120 ([f2c61e5](https://github.com/Hufe921/canvas-editor/commit/f2c61e539747c71a6e051fe9f607bf0098b3b22f)), closes [#1120](https://github.com/Hufe921/canvas-editor/issues/1120)
* add isIgnoreDisabledRule option to richtext style setting apis #1109 ([46d917c](https://github.com/Hufe921/canvas-editor/commit/46d917caa5023c28e692a852f5b036bfbb9a6f0d)), closes [#1109](https://github.com/Hufe921/canvas-editor/issues/1109)
* add isSubmitHistory option to the insert element apis #1124 ([424e01f](https://github.com/Hufe921/canvas-editor/commit/424e01f9d30d88cf8d749cb169c6733309821d71)), closes [#1124](https://github.com/Hufe921/canvas-editor/issues/1124)



## [0.9.108](https://github.com/Hufe921/canvas-editor/compare/v0.9.107...v0.9.108) (2025-04-30)


### Bug Fixes

* delete pickElementAttr method data reference #1107 ([a7a7e47](https://github.com/Hufe921/canvas-editor/commit/a7a7e474b6170d26c2b253c8189720e25e17438b)), closes [#1107](https://github.com/Hufe921/canvas-editor/issues/1107)
* set non deletable control boundary error #1111 ([34fe3e8](https://github.com/Hufe921/canvas-editor/commit/34fe3e87d03b0abf22511d5054ea966847ef853a)), closes [#1111](https://github.com/Hufe921/canvas-editor/issues/1111)


### Chores

* update README.md ([f6828fb](https://github.com/Hufe921/canvas-editor/commit/f6828fb43a176d3098fe3bac1cd0dde9744d630d))


### Features

* add control disabledBackgroundColor option #1105 ([bb6b5ce](https://github.com/Hufe921/canvas-editor/commit/bb6b5ce711ab784ff4e1f3e2b98629bca2018dbd)), closes [#1105](https://github.com/Hufe921/canvas-editor/issues/1105)
* locate outside the control #1100 ([949421b](https://github.com/Hufe921/canvas-editor/commit/949421baad9ba5854913af0bc17f1b4df7b88f69)), closes [#1100](https://github.com/Hufe921/canvas-editor/issues/1100)



## [0.9.107](https://github.com/Hufe921/canvas-editor/compare/v0.9.106...v0.9.107) (2025-04-18)


### Bug Fixes

* area background position error #1082 ([d708629](https://github.com/Hufe921/canvas-editor/commit/d708629c4883b73c78d722352a6ff5a08642fa9e)), closes [#1082](https://github.com/Hufe921/canvas-editor/issues/1082)
* delete control element boundary error #1079 ([b8132cd](https://github.com/Hufe921/canvas-editor/commit/b8132cdd82822b2840dee95a88fcc8492737f352)), closes [#1079](https://github.com/Hufe921/canvas-editor/issues/1079)
* input boundary error when control is disabled #1092 ([353ada2](https://github.com/Hufe921/canvas-editor/commit/353ada21cd70adb61094fef301462063ddc00a01)), closes [#1092](https://github.com/Hufe921/canvas-editor/issues/1092)
* update area element context #1084 ([a7598d2](https://github.com/Hufe921/canvas-editor/commit/a7598d2a08e87e86ea34e80903f168010362d188)), closes [#1084](https://github.com/Hufe921/canvas-editor/issues/1084)


### Features

* add area deletable option #1014 ([6bb1982](https://github.com/Hufe921/canvas-editor/commit/6bb19824c1f6f31adb99ecac5c8b20d3dfa7b17c)), closes [#1014](https://github.com/Hufe921/canvas-editor/issues/1014)
* add area placeholder option #1076 ([fd9f780](https://github.com/Hufe921/canvas-editor/commit/fd9f780b537c99d9aaa93054e6bbaee8b363ec45)), closes [#1076](https://github.com/Hufe921/canvas-editor/issues/1076)
* add conceptId to executeImage api #1080 ([b05eb06](https://github.com/Hufe921/canvas-editor/commit/b05eb065e25162ebf21a32c160db6f3e74365588)), closes [#1080](https://github.com/Hufe921/canvas-editor/issues/1080)
* remove null values when merging cells #1096 ([f673352](https://github.com/Hufe921/canvas-editor/commit/f673352b095653e85921c02cee7a23a0bd8105b1)), closes [#1096](https://github.com/Hufe921/canvas-editor/issues/1096)



## [0.9.106](https://github.com/Hufe921/canvas-editor/compare/v0.9.105...v0.9.106) (2025-04-04)


### Bug Fixes

* delete elements within the td when dragging #1056 ([dcb7589](https://github.com/Hufe921/canvas-editor/commit/dcb7589afa2b00bcb0775a4d216032339368e695)), closes [#1056](https://github.com/Hufe921/canvas-editor/issues/1056)
* internal shortcut keys ignore capitalization #1061 ([c282366](https://github.com/Hufe921/canvas-editor/commit/c28236699cf7ce2acb55fbb5a8dcbf52f46aae89)), closes [#1061](https://github.com/Hufe921/canvas-editor/issues/1061)


### Chores

* optimize the import interface path ([7256a13](https://github.com/Hufe921/canvas-editor/commit/7256a13d57735a51700af3ba261fe4c684a47250))


### Features

* add dragFloatImageDisabled to cursor option #1054 ([09a8de2](https://github.com/Hufe921/canvas-editor/commit/09a8de2a88bc3193b5cfee366dcae189e38fc8da)), closes [#1054](https://github.com/Hufe921/canvas-editor/issues/1054)
* add getValueAsync api #1067 ([6f34bce](https://github.com/Hufe921/canvas-editor/commit/6f34bce7db81f429372bba9110df8a2f314c4981)), closes [#1067](https://github.com/Hufe921/canvas-editor/issues/1067)
* add row number to RangeContext ([fa5936e](https://github.com/Hufe921/canvas-editor/commit/fa5936ec004de0273d9b94fa86a08162cce4cad4))
* batch set control properties #1037 ([94e7b2c](https://github.com/Hufe921/canvas-editor/commit/94e7b2ca7cd43fd3da83612369cb29c074481378)), closes [#1037](https://github.com/Hufe921/canvas-editor/issues/1037)



## [0.9.105](https://github.com/Hufe921/canvas-editor/compare/v0.9.104...v0.9.105) (2025-03-15)


### Bug Fixes

* delete hidden control boundary error #1036 ([960e918](https://github.com/Hufe921/canvas-editor/commit/960e91841f4b8a6c8a176f3f09f8cb2d3f1fccee)), closes [#1036](https://github.com/Hufe921/canvas-editor/issues/1036)
* initial print mode settings invalid #1034 ([6d95284](https://github.com/Hufe921/canvas-editor/commit/6d95284609edf855b8bd049fff15816cb2710cd1)), closes [#1034](https://github.com/Hufe921/canvas-editor/issues/1034)


### Features

* add border width to table option #897 ([17550b9](https://github.com/Hufe921/canvas-editor/commit/17550b98b4798e6887c7320d7125d54287b92bcf)), closes [#897](https://github.com/Hufe921/canvas-editor/issues/897)
* add imageSizeChange event #1035 ([f93f3a7](https://github.com/Hufe921/canvas-editor/commit/f93f3a73be31aaf8c569869928970a4787ca7244)), closes [#1035](https://github.com/Hufe921/canvas-editor/issues/1035)
* add isReplace option to executeInsertElementList api #1031 ([076302a](https://github.com/Hufe921/canvas-editor/commit/076302a9192cff9990a8d5f76672d16e32151f33)), closes [#1031](https://github.com/Hufe921/canvas-editor/issues/1031)
* add table external border width option #897 ([9df856f](https://github.com/Hufe921/canvas-editor/commit/9df856f61272098d5a004bb2df7eb07d1f34d078)), closes [#897](https://github.com/Hufe921/canvas-editor/issues/897)
* update cursor on right-click #1022 ([edd5df3](https://github.com/Hufe921/canvas-editor/commit/edd5df3029c3aaa6763bcbe1dc9152c70cf3b330)), closes [#1022](https://github.com/Hufe921/canvas-editor/issues/1022)



## [0.9.104](https://github.com/Hufe921/canvas-editor/compare/v0.9.103...v0.9.104) (2025-02-22)


### Bug Fixes

* missing some fields when zip elements #1023 ([c41fc9e](https://github.com/Hufe921/canvas-editor/commit/c41fc9eb578d4dc0f59cbb642050cee49158b460)), closes [#1023](https://github.com/Hufe921/canvas-editor/issues/1023)


### Features

* add imgToolDisabled option #1028 ([01b2c16](https://github.com/Hufe921/canvas-editor/commit/01b2c16596e9208bfdc08182b5e329f7a78a6b45)), closes [#1028](https://github.com/Hufe921/canvas-editor/issues/1028)
* increase priority when zip area elements #1020 ([21543cc](https://github.com/Hufe921/canvas-editor/commit/21543cc15f87302cd89d53da56f1a0a95b0a9f54)), closes [#1020](https://github.com/Hufe921/canvas-editor/issues/1020)


### Performance Improvements

* spliceElementList method performance #1021 ([2066d0d](https://github.com/Hufe921/canvas-editor/commit/2066d0de80a2f2aae5f0b8bc4f0bc8378aaaa47d)), closes [#1021](https://github.com/Hufe921/canvas-editor/issues/1021)



## [0.9.103](https://github.com/Hufe921/canvas-editor/compare/v0.9.102...v0.9.103) (2025-02-16)


### Bug Fixes

* checkbox list select error in paper horizontal mode #997 ([5442f5e](https://github.com/Hufe921/canvas-editor/commit/5442f5ea1795cd54869912e887aacb60a3160cc9)), closes [#997](https://github.com/Hufe921/canvas-editor/issues/997)
* control content change event boundary error #996 ([e6c681d](https://github.com/Hufe921/canvas-editor/commit/e6c681d2867c7894491b42842ac180503f0702a3)), closes [#996](https://github.com/Hufe921/canvas-editor/issues/996)
* format error when update element by id #1006 ([15728e8](https://github.com/Hufe921/canvas-editor/commit/15728e8d799cf334bcc355cc7198ebcfc0345843)), closes [#1006](https://github.com/Hufe921/canvas-editor/issues/1006)


### Chores

* update issue template ([fd34310](https://github.com/Hufe921/canvas-editor/commit/fd343106fbd613f395a78d768dbca306d9461338))
* update README.md ([e355de8](https://github.com/Hufe921/canvas-editor/commit/e355de8a597b58b9b79aba1bfec2ae31e0db4589))


### Features

* add executeDeleteElementById api #1003 ([089d684](https://github.com/Hufe921/canvas-editor/commit/089d6841988d20efb84efd6556469455207d5a2e)), closes [#1003](https://github.com/Hufe921/canvas-editor/issues/1003)
* convert block elements to html #984 ([b77fd96](https://github.com/Hufe921/canvas-editor/commit/b77fd96dfadc012c6a2a9a4957d59fb8af0abc55)), closes [#984](https://github.com/Hufe921/canvas-editor/issues/984)


### Performance Improvements

* mouse event listener option #1010 ([56f9604](https://github.com/Hufe921/canvas-editor/commit/56f9604e9c8c11e31c7c86f5246373412bcc6625)), closes [#1010](https://github.com/Hufe921/canvas-editor/issues/1010)
* timing of updating range style #985 ([cfb09ce](https://github.com/Hufe921/canvas-editor/commit/cfb09cef78c9e661540b87834495dc5a19839ef8)), closes [#985](https://github.com/Hufe921/canvas-editor/issues/985)



## [0.9.102](https://github.com/Hufe921/canvas-editor/compare/v0.9.101...v0.9.102) (2025-02-07)


### Bug Fixes

* clear control content boundary error #988 ([635f7f0](https://github.com/Hufe921/canvas-editor/commit/635f7f09a4bd76386860bc2c6694e8b07f107897)), closes [#988](https://github.com/Hufe921/canvas-editor/issues/988)
* disable replace when element cannot be deleted #976 ([f0ffe31](https://github.com/Hufe921/canvas-editor/commit/f0ffe317f6b5a956b192b9ad00b39c3a123ae6bd)), closes [#976](https://github.com/Hufe921/canvas-editor/issues/976)


### Features

* add control content change event #940 ([01a3149](https://github.com/Hufe921/canvas-editor/commit/01a31491ff3432ee8a0ed6a1855013a5b3fe5fb1)), closes [#940](https://github.com/Hufe921/canvas-editor/issues/940)
* add executeLocationArea api #940 ([cd42514](https://github.com/Hufe921/canvas-editor/commit/cd42514a01eca2e133c1fd875cfc9b8f85fb97ff)), closes [#940](https://github.com/Hufe921/canvas-editor/issues/940)
* add hide property to control element #979 ([e49fe94](https://github.com/Hufe921/canvas-editor/commit/e49fe94efef5becb54fbc5d9ba3c059ae65cdf35)), closes [#979](https://github.com/Hufe921/canvas-editor/issues/979)
* add id option to executeImage api #989 ([d82237e](https://github.com/Hufe921/canvas-editor/commit/d82237e586d425742dce2e123fc6c459abb8c275)), closes [#989](https://github.com/Hufe921/canvas-editor/issues/989)
* add page number format option to watermark #981 ([b3c6259](https://github.com/Hufe921/canvas-editor/commit/b3c6259fd55be34f0f1d58828aa790427df759f4)), closes [#981](https://github.com/Hufe921/canvas-editor/issues/981)
* copy style when insert tab element #974 ([ae8bbb8](https://github.com/Hufe921/canvas-editor/commit/ae8bbb87a5ac019a982c9b737370ea72ce6c342e)), closes [#974](https://github.com/Hufe921/canvas-editor/issues/974)
* prefer structuredClone api for cloning #980 ([fdda5c7](https://github.com/Hufe921/canvas-editor/commit/fdda5c7e1b16e5d76ac547d04507c0b0f8846208)), closes [#980](https://github.com/Hufe921/canvas-editor/issues/980)



## [0.9.101](https://github.com/Hufe921/canvas-editor/compare/v0.9.100...v0.9.101) (2025-01-18)


### Bug Fixes

* image asynchronous rendering boundary error #959 ([344a6e0](https://github.com/Hufe921/canvas-editor/commit/344a6e038862a290c810ab55b66ae7fcceffecae)), closes [#959](https://github.com/Hufe921/canvas-editor/issues/959)
* verify the range boundary error of control in the table #959 ([6d55698](https://github.com/Hufe921/canvas-editor/commit/6d55698987d7a4a119b0514560625db09884cd94)), closes [#959](https://github.com/Hufe921/canvas-editor/issues/959)


### Features

* add isSubmitHistory option to setControlValue api #960 ([9c0b67f](https://github.com/Hufe921/canvas-editor/commit/9c0b67f184ebb35cc74dcacc10e44efc39c2c95d)), closes [#960](https://github.com/Hufe921/canvas-editor/issues/960)
* add option to executeReplace api #969 ([3fbaa3b](https://github.com/Hufe921/canvas-editor/commit/3fbaa3b7cc513336b8278221c639ea651e27155f)), closes [#969](https://github.com/Hufe921/canvas-editor/issues/969)
* add split table cell api #826 ([04c7194](https://github.com/Hufe921/canvas-editor/commit/04c7194a94845d54456798509846fc2f9a86f807)), closes [#826](https://github.com/Hufe921/canvas-editor/issues/826)
* not update default range style when unchanged #970 ([21a71c0](https://github.com/Hufe921/canvas-editor/commit/21a71c0cfabaf9e6f0a68ca5ddbe1df49d408ee8)), closes [#970](https://github.com/Hufe921/canvas-editor/issues/970)


### Performance Improvements

* deep clone performance for control data #971 ([71d52de](https://github.com/Hufe921/canvas-editor/commit/71d52de30c63beca806c0a7af0c82c1244d59429)), closes [#971](https://github.com/Hufe921/canvas-editor/issues/971)



## [0.9.100](https://github.com/Hufe921/canvas-editor/compare/v0.9.99...v0.9.100) (2025-01-03)


### Bug Fixes

* get or update elements within a table by id #951 ([951de97](https://github.com/Hufe921/canvas-editor/commit/951de9794186cb6225e1f668f1021f6e7f04b1bc)), closes [#951](https://github.com/Hufe921/canvas-editor/issues/951)
* set default style boundary error #942 ([2fd9d10](https://github.com/Hufe921/canvas-editor/commit/2fd9d10c10705df57fbc67455edb8da05df92d0a)), closes [#942](https://github.com/Hufe921/canvas-editor/issues/942)


### Features

* add table tool disabled option #954 ([a6eccc7](https://github.com/Hufe921/canvas-editor/commit/a6eccc7a78569e881d80c745f8a77455b91df0ad)), closes [#954](https://github.com/Hufe921/canvas-editor/issues/954)
* adjust watermark rendering layer #948 ([0f53552](https://github.com/Hufe921/canvas-editor/commit/0f5355216c1c092ea59ecb737f447c0a0ff11558)), closes [#948](https://github.com/Hufe921/canvas-editor/issues/948)
* optimize cursor focus in readonly mode #936 ([2e0ac96](https://github.com/Hufe921/canvas-editor/commit/2e0ac966e839a2dc9df911b04d24577c46d930e4)), closes [#936](https://github.com/Hufe921/canvas-editor/issues/936)
* preserve cell content when merging cells #932 ([167bfa1](https://github.com/Hufe921/canvas-editor/commit/167bfa1e7c44a580f29c06bccd9bf5675e4d166f)), closes [#932](https://github.com/Hufe921/canvas-editor/issues/932)



## [0.9.99](https://github.com/Hufe921/canvas-editor/compare/v0.9.98...v0.9.99) (2024-12-20)


### Bug Fixes

* locate catalog when the context is within the table ([012dc7d](https://github.com/Hufe921/canvas-editor/commit/012dc7debcce4366c8e094cbc2af1a7892227ad2))
* optimize image caching method #933 ([8516931](https://github.com/Hufe921/canvas-editor/commit/85169313bd8f51feb9f442cb32b774dcbc580e96)), closes [#933](https://github.com/Hufe921/canvas-editor/issues/933)
* verify control integrity boundary error #920 ([77a2550](https://github.com/Hufe921/canvas-editor/commit/77a25504bc40caaf20390944f286748bdf113e39)), closes [#920](https://github.com/Hufe921/canvas-editor/issues/920)


### Chores

* rename some particles ([b5d18d3](https://github.com/Hufe921/canvas-editor/commit/b5d18d3a59f89a701758af160fc889e49ba1f5c6))


### Features

* add badge option #918 ([190785a](https://github.com/Hufe921/canvas-editor/commit/190785ac69f6187d10abb070eab32a523e394b34)), closes [#918](https://github.com/Hufe921/canvas-editor/issues/918)
* add control flex direction option #652 ([c599d56](https://github.com/Hufe921/canvas-editor/commit/c599d563b631f29a6bea6fe94624afa05c6879ef)), closes [#652](https://github.com/Hufe921/canvas-editor/issues/652)
* add number control #925 ([aff4979](https://github.com/Hufe921/canvas-editor/commit/aff49797da3f7e966b9f692269468ccb792af309)), closes [#925](https://github.com/Hufe921/canvas-editor/issues/925)
* delete control by id or conceptId #905 ([5d434bd](https://github.com/Hufe921/canvas-editor/commit/5d434bd7d3dce31f761a0e1f6c81dfa7a80bb03e)), closes [#905](https://github.com/Hufe921/canvas-editor/issues/905)
* element id support customization ([c79be3a](https://github.com/Hufe921/canvas-editor/commit/c79be3ab72e9e1cda75e7af2b8b8d50e1ba2085a))
* optimize cursor focus when dragging elements #926 ([3679cbd](https://github.com/Hufe921/canvas-editor/commit/3679cbd4205427a1337e023c318ea98be3c952f8)), closes [#926](https://github.com/Hufe921/canvas-editor/issues/926)



## [0.9.98](https://github.com/Hufe921/canvas-editor/compare/v0.9.97...v0.9.98) (2024-12-01)


### Bug Fixes

*  fix: paste error caused by different line breaks #912 ([e45f4e9](https://github.com/Hufe921/canvas-editor/commit/e45f4e96389a5273a13aebacc5f5577721bb2da1)), closes [#912](https://github.com/Hufe921/canvas-editor/issues/912)
* control property modification #914 ([a827138](https://github.com/Hufe921/canvas-editor/commit/a827138978bb9953d351d30d994f586738f080fd)), closes [#914](https://github.com/Hufe921/canvas-editor/issues/914)
* copy elements within the control #901 ([750bf14](https://github.com/Hufe921/canvas-editor/commit/750bf14428c7c7e55ed55f88c0c2b20f31f76e59)), closes [#901](https://github.com/Hufe921/canvas-editor/issues/901)
* insertControl and insertTitle apis add area context #911 ([b6294b2](https://github.com/Hufe921/canvas-editor/commit/b6294b264a93a25c12acdae2041132ba88c79ba0)), closes [#911](https://github.com/Hufe921/canvas-editor/issues/911)
* processing area property is empty ([5112451](https://github.com/Hufe921/canvas-editor/commit/5112451f912e814af8439b907eb87ce5df6ee38c))
* table row height calculation boundary error #909 ([bbb554f](https://github.com/Hufe921/canvas-editor/commit/bbb554feabec664df89fd7d751be4f89c97b5145)), closes [#909](https://github.com/Hufe921/canvas-editor/issues/909)


### Features

* add executePageScale api #906 ([2430bf7](https://github.com/Hufe921/canvas-editor/commit/2430bf70d69ce97c0cc10d5b99d50f58ff1838ed)), closes [#906](https://github.com/Hufe921/canvas-editor/issues/906)
* add plain text copy option ([34c4401](https://github.com/Hufe921/canvas-editor/commit/34c4401cb0c461cc64e223f0b23fddc679bc88c7))
* add select control can input option #518 ([1d01576](https://github.com/Hufe921/canvas-editor/commit/1d01576769960fa130f8a16410c74d5a285084ee)), closes [#518](https://github.com/Hufe921/canvas-editor/issues/518)
* add table border color #897 ([7e8af04](https://github.com/Hufe921/canvas-editor/commit/7e8af04977d8c8038e8af262c0cfde2b46704a03)), closes [#897](https://github.com/Hufe921/canvas-editor/issues/897)
* add text before and after the control #902 ([5e15ffe](https://github.com/Hufe921/canvas-editor/commit/5e15ffebc6b34394138b4a6c47fc90033bd82819)), closes [#902](https://github.com/Hufe921/canvas-editor/issues/902)
* the select control support multiple selection #518 ([62ae039](https://github.com/Hufe921/canvas-editor/commit/62ae039d58768ad580696229695ce80af0c1b257)), closes [#518](https://github.com/Hufe921/canvas-editor/issues/518)



## [0.9.97](https://github.com/Hufe921/canvas-editor/compare/v0.9.96...v0.9.97) (2024-11-22)


### Bug Fixes

* add the first character of area ([1a3f062](https://github.com/Hufe921/canvas-editor/commit/1a3f0626514615d3b5c48dfca9d4d5a03b673ad3))
* cursor position is on the top margin calculation error #882 ([992e4ed](https://github.com/Hufe921/canvas-editor/commit/992e4edb2a7ade02847a0be234d3ca4f429949ff)), closes [#882](https://github.com/Hufe921/canvas-editor/issues/882)
* data retrieval error when control was destroyed #884 ([1c5ef78](https://github.com/Hufe921/canvas-editor/commit/1c5ef7801ac1fb18fe131912cbd2547023e35982)), closes [#884](https://github.com/Hufe921/canvas-editor/issues/884)
* destroy control boundary error #895 ([6bed83b](https://github.com/Hufe921/canvas-editor/commit/6bed83b645f67c5c59ba5c4ee811e985e1dbc60f)), closes [#895](https://github.com/Hufe921/canvas-editor/issues/895)
* disable highlight style in print mode #893 ([49360fd](https://github.com/Hufe921/canvas-editor/commit/49360fda0eff9ae24f5b79b742bd8cdf1f99ca20)), closes [#893](https://github.com/Hufe921/canvas-editor/issues/893)
* insert area error when cursor is within table #891 ([b16aa71](https://github.com/Hufe921/canvas-editor/commit/b16aa71798c440327d49c6c8f4c3166ea5bc5ee7)), closes [#891](https://github.com/Hufe921/canvas-editor/issues/891)
* line break rendering error for control placeholder #883 ([679c4fa](https://github.com/Hufe921/canvas-editor/commit/679c4fac5f3eba524f582cb090390b2e302a1b81)), closes [#883](https://github.com/Hufe921/canvas-editor/issues/883)
* set alignment error when row width is not enough #885 ([c71d99c](https://github.com/Hufe921/canvas-editor/commit/c71d99cbd4d827b8af6788663f46403b141e2797)), closes [#885](https://github.com/Hufe921/canvas-editor/issues/885)
* virtual input location boundary error #878 ([2d43343](https://github.com/Hufe921/canvas-editor/commit/2d43343d83917ea35340a8610958df4e09d67e8b)), closes [#878](https://github.com/Hufe921/canvas-editor/issues/878)


### Chores

* export controlId and titleId ([30b405c](https://github.com/Hufe921/canvas-editor/commit/30b405c270a7ca6a09f5824b3cf4a5bd552e0478))
* update add control method ([c370df7](https://github.com/Hufe921/canvas-editor/commit/c370df7d3666ab0ed99fc2538b50e3bb5fbd0bf1))


### Features

* add area element #216 ([204a886](https://github.com/Hufe921/canvas-editor/commit/204a886c1dcd01c3b56695eef74c3c39221bcdb3)), closes [#216](https://github.com/Hufe921/canvas-editor/issues/216)
* add control state property to the ControlChange event #884 ([e5480a3](https://github.com/Hufe921/canvas-editor/commit/e5480a3f00044e901b255c77f6b8ae7fb91ef4f4)), closes [#884](https://github.com/Hufe921/canvas-editor/issues/884)
* handle copy area context boundary ([64b4100](https://github.com/Hufe921/canvas-editor/commit/64b41009c42dbba1600e92301a6db89cd8fb421d))
* style settings when range is collapsed #870 ([fbdd5f6](https://github.com/Hufe921/canvas-editor/commit/fbdd5f62786398e66c7740da28b1656c4f36f131)), closes [#870](https://github.com/Hufe921/canvas-editor/issues/870)



## [0.9.96](https://github.com/Hufe921/canvas-editor/compare/v0.9.95...v0.9.96) (2024-11-09)


### Bug Fixes

* adjust column width after adding new columns #855 ([2439c24](https://github.com/Hufe921/canvas-editor/commit/2439c24e120bdfb0553d5f32ef9af25517bb6baa)), closes [#855](https://github.com/Hufe921/canvas-editor/issues/855)
* focus editor when selection exists #871 ([85cc2b7](https://github.com/Hufe921/canvas-editor/commit/85cc2b7f68726fbecb1484f420a6d20bda004dfe)), closes [#871](https://github.com/Hufe921/canvas-editor/issues/871)
* margin height in continuous page mode ([c0403b8](https://github.com/Hufe921/canvas-editor/commit/c0403b8f8d069d0c4b3fcb8bb23159cb1fb00fe5))
* table rendering error after pagination when scaled #867 ([a1472c2](https://github.com/Hufe921/canvas-editor/commit/a1472c23aacef239f00cab9ab365d261599d1bee)), closes [#867](https://github.com/Hufe921/canvas-editor/issues/867)


### Chores

* export EDITOR_CLIPBOARD constant #860 ([7e56297](https://github.com/Hufe921/canvas-editor/commit/7e562970031a4227d3d8ac66f2447cf2c52f25d1)), closes [#860](https://github.com/Hufe921/canvas-editor/issues/860)
* update README.md ([3a81d56](https://github.com/Hufe921/canvas-editor/commit/3a81d56974e1e30bb01985f9a79de7f31785a8fc))


### Features

* add control paste disabled rule #853 ([2bb84ab](https://github.com/Hufe921/canvas-editor/commit/2bb84abb5f3fb6670ca9ae88e96f5790de4b6a9d)), closes [#853](https://github.com/Hufe921/canvas-editor/issues/853)
* add getElementById api ([8eabd07](https://github.com/Hufe921/canvas-editor/commit/8eabd0719981b16f4ba87005d5759c6710848bde))
* add table dashed border #858 ([dffac63](https://github.com/Hufe921/canvas-editor/commit/dffac639739d82e50cb122b3c95af12805351bb9)), closes [#858](https://github.com/Hufe921/canvas-editor/issues/858)
* add table internal border #869 ([5cc4f13](https://github.com/Hufe921/canvas-editor/commit/5cc4f1349cacc974918068619dc9b258f6c9cad5)), closes [#869](https://github.com/Hufe921/canvas-editor/issues/869)
* optimize previewer interactive in readonly mode #875 ([09b8bac](https://github.com/Hufe921/canvas-editor/commit/09b8baca888453685eba03e205f91187a101427c)), closes [#875](https://github.com/Hufe921/canvas-editor/issues/875)
* quick select table row and col tool ([c6a1703](https://github.com/Hufe921/canvas-editor/commit/c6a170367fbcb9822bce3040ebd63bed8ea27355))



## [0.9.95](https://github.com/Hufe921/canvas-editor/compare/v0.9.94...v0.9.95) (2024-10-19)


### Bug Fixes

* date element update data boundary error #835 ([7f69fd9](https://github.com/Hufe921/canvas-editor/commit/7f69fd9ca2ea474167b10b0e122b745cffed2ab8)), closes [#835](https://github.com/Hufe921/canvas-editor/issues/835)
* previewer wheel event stop propagation ([ddf0806](https://github.com/Hufe921/canvas-editor/commit/ddf0806e3751c12c56523b987dc1031a85b17b69))
* set table context error when using directional keys ([b210ce3](https://github.com/Hufe921/canvas-editor/commit/b210ce39b1a440d8fecf7d222c5398b2025d3d68))


### Chores

* update watermark option ([d14e720](https://github.com/Hufe921/canvas-editor/commit/d14e72001784202db5eeb7d9bb5ca76cce3cea3c))


### Documentation

* update api markdown ([8c0f660](https://github.com/Hufe921/canvas-editor/commit/8c0f660bce8b2a579041af073e04de89913aa1a2))


### Features

* add getKeywordContext api #846 ([abbb62d](https://github.com/Hufe921/canvas-editor/commit/abbb62df3bf45e64c67a7da3f7bbe666f4eb1328)), closes [#846](https://github.com/Hufe921/canvas-editor/issues/846)
* control element support set row flex #839 ([3f265c8](https://github.com/Hufe921/canvas-editor/commit/3f265c835b8f63bcc07b41596ab4dce886e99629)), closes [#839](https://github.com/Hufe921/canvas-editor/issues/839)
* export getElementListByHTML and getTextFromElementList api ([590c97d](https://github.com/Hufe921/canvas-editor/commit/590c97db225931d6bb4e117736a71be83cbb117e))
* remove row spacing from continuous tables #842 ([a4d8633](https://github.com/Hufe921/canvas-editor/commit/a4d863320bc8f9b2efa0390c09d58566faa62be9)), closes [#842](https://github.com/Hufe921/canvas-editor/issues/842)



## [0.9.94](https://github.com/Hufe921/canvas-editor/compare/v0.9.93...v0.9.94) (2024-10-07)


### Bug Fixes

* pageSizeChange event listener inaccurate #817 ([0308089](https://github.com/Hufe921/canvas-editor/commit/03080896f594afb3044d401fa736bcaabc8153c4)), closes [#817](https://github.com/Hufe921/canvas-editor/issues/817)


### Documentation

* update command markdown ([b2978b2](https://github.com/Hufe921/canvas-editor/commit/b2978b27c279945ea77d2e00f7233e0351975ed9))


### Features

* add get cursor position api ([3052337](https://github.com/Hufe921/canvas-editor/commit/30523378a8d5f0fac18bd06a2a3fdd259a758be3))
* add header and footer editable option ([aa667a6](https://github.com/Hufe921/canvas-editor/commit/aa667a6b8d8f12b5df207111b45f17d1e1fc0e8d))
* add repeat attribute to watermark #665 ([c6e0176](https://github.com/Hufe921/canvas-editor/commit/c6e017631cda9f85301a0f97816f41c1b042a42e)), closes [#665](https://github.com/Hufe921/canvas-editor/issues/665)
* export createDomFromElementList function #819 ([f7b6f42](https://github.com/Hufe921/canvas-editor/commit/f7b6f42c7f4a7daa9e1bad398255b4ca6078103a)), closes [#819](https://github.com/Hufe921/canvas-editor/issues/819)
* quick add table select tool ([6a05052](https://github.com/Hufe921/canvas-editor/commit/6a05052d9e97b35297fbd29f128faca0a486a6a7))
* the control api support set and get element list #816 ([9482f85](https://github.com/Hufe921/canvas-editor/commit/9482f85f0e860e0449402fdbb80ca80a3bcd800c)), closes [#816](https://github.com/Hufe921/canvas-editor/issues/816)



## [0.9.93](https://github.com/Hufe921/canvas-editor/compare/v0.9.92...v0.9.93) (2024-09-20)


### Bug Fixes

* executeUpdateElementById api format data error #806 ([1f88dca](https://github.com/Hufe921/canvas-editor/commit/1f88dcafae035be1130f0956c51c21fa60c3759e)), closes [#806](https://github.com/Hufe921/canvas-editor/issues/806)
* image floating position boundary error ([a833f85](https://github.com/Hufe921/canvas-editor/commit/a833f85ade8ec7d0d7cc2a27f79f34ef747a9987))


### Chores

* change the style of the hollow block list #809 ([9880deb](https://github.com/Hufe921/canvas-editor/commit/9880deb116e0b135556592b124dc95861fc2b0b6)), closes [#809](https://github.com/Hufe921/canvas-editor/issues/809)


### Documentation

* update plugin markdown ([e5711b4](https://github.com/Hufe921/canvas-editor/commit/e5711b40189d93a887280a88e5604ee9429ae20e))


### Features

* add image surround display #554 ([a9f80a4](https://github.com/Hufe921/canvas-editor/commit/a9f80a448f42b09de6ac5f36aac8cd2d01dfae38)), closes [#554](https://github.com/Hufe921/canvas-editor/issues/554)
* add the pageNo property to the getCatalog api ([1e48893](https://github.com/Hufe921/canvas-editor/commit/1e48893e92ee16eb3de463910d6ccebe83aefce0))
* add title attributes to range context #738 ([1e8a923](https://github.com/Hufe921/canvas-editor/commit/1e8a923da4fe1c4bb6470cf9623818c9c6c66a5f)), closes [#738](https://github.com/Hufe921/canvas-editor/issues/738)
* quick add table row and col tool ([641acda](https://github.com/Hufe921/canvas-editor/commit/641acdabf26ae99c2239e1ffebdb59b6e4a78f75))
* separate table operation api ([ee2312e](https://github.com/Hufe921/canvas-editor/commit/ee2312e9071473bb296d4515bab60254937e2414))



## [0.9.92](https://github.com/Hufe921/canvas-editor/compare/v0.9.91...v0.9.92) (2024-09-06)


### Bug Fixes

* update resizer size when scaling the page ([2351855](https://github.com/Hufe921/canvas-editor/commit/2351855e83c87da3b0999799102e6e051b456295))


### Documentation

* update command markdown #792 ([3c598ba](https://github.com/Hufe921/canvas-editor/commit/3c598bae1a4fb10d74fd330e46f95aa386edc956)), closes [#792](https://github.com/Hufe921/canvas-editor/issues/792)
* update plugin markdown #789 ([91c68e8](https://github.com/Hufe921/canvas-editor/commit/91c68e8dcd117e3189bbb9385fca4c42b2074c23)), closes [#789](https://github.com/Hufe921/canvas-editor/issues/789)


### Features

* add deletable and disabled attributes for table td #724 ([753510b](https://github.com/Hufe921/canvas-editor/commit/753510bac4f763ab2f034657d9efd7d9760f9d4a)), closes [#724](https://github.com/Hufe921/canvas-editor/issues/724)
* add design mode #795 ([55a58cd](https://github.com/Hufe921/canvas-editor/commit/55a58cdfb20ba7b642400314a9ea0d207e2e7dc4)), closes [#795](https://github.com/Hufe921/canvas-editor/issues/795)
* add executeFocus api #796 ([3c17631](https://github.com/Hufe921/canvas-editor/commit/3c176318e079d8f793367df552c1a3c6a6294840)), closes [#796](https://github.com/Hufe921/canvas-editor/issues/796)
* add extension property to Td and Tr element #799 ([0074781](https://github.com/Hufe921/canvas-editor/commit/0074781ef3753cdf9baf4cae77325de5d7b2e9df)), closes [#799](https://github.com/Hufe921/canvas-editor/issues/799)
* add position context change actuator #733 ([66c73e1](https://github.com/Hufe921/canvas-editor/commit/66c73e174c54106cdf35e6d40382bb4a7ceeae43)), closes [#733](https://github.com/Hufe921/canvas-editor/issues/733)
* highlight the background when the control is activated #740 ([b426b13](https://github.com/Hufe921/canvas-editor/commit/b426b13ec6ffbb5aebe6d008ddc3ccc8b5efaa05)), closes [#740](https://github.com/Hufe921/canvas-editor/issues/740)



## [0.9.91](https://github.com/Hufe921/canvas-editor/compare/v0.9.90...v0.9.91) (2024-08-25)


### Bug Fixes

* format different types of line breaks #769 ([f65ff87](https://github.com/Hufe921/canvas-editor/commit/f65ff87e44728322417d235d2347ceca25cc6667)), closes [#769](https://github.com/Hufe921/canvas-editor/issues/769)
* format initial data boundary error #771 #784 ([f62a315](https://github.com/Hufe921/canvas-editor/commit/f62a315a7bd04e49e9e17bc7737ccd1f0e751d69)), closes [#771](https://github.com/Hufe921/canvas-editor/issues/771) [#784](https://github.com/Hufe921/canvas-editor/issues/784)
* set row margin boundary error ([5285170](https://github.com/Hufe921/canvas-editor/commit/528517094373b5fa9ca2145bb259889db865a588))


### Features

* add page border ([3f6bdf6](https://github.com/Hufe921/canvas-editor/commit/3f6bdf6fcb583ab370cb5abe3eafebf6100f415e))
* hit checkbox/radio control when click on label #651 ([31b76b6](https://github.com/Hufe921/canvas-editor/commit/31b76b6fb6640ea75383569cb16ad1b5a2ccf25f)), closes [#651](https://github.com/Hufe921/canvas-editor/issues/651)



## [0.9.90](https://github.com/Hufe921/canvas-editor/compare/v0.9.89...v0.9.90) (2024-08-18)


### Bug Fixes

* float image position when scaling the page #766 ([c249b9e](https://github.com/Hufe921/canvas-editor/commit/c249b9eec215fe573b325d1430212f5f01c32099)), closes [#766](https://github.com/Hufe921/canvas-editor/issues/766)
* get range paragraph info boundary error #758 ([4653fe7](https://github.com/Hufe921/canvas-editor/commit/4653fe7427f4a9ec40700f6a86ff284d1d46088a)), closes [#758](https://github.com/Hufe921/canvas-editor/issues/758)
* insert block element row flex error #754 ([136b1ff](https://github.com/Hufe921/canvas-editor/commit/136b1ffa55b7b0b78bf3d114400489e1bbab4f17)), closes [#754](https://github.com/Hufe921/canvas-editor/issues/754)
* paper printing size setting #760 ([7a6dd75](https://github.com/Hufe921/canvas-editor/commit/7a6dd753e59bde4cb581ac215b038dd1cd08c96f)), closes [#760](https://github.com/Hufe921/canvas-editor/issues/760)
* set editor mode option error #755 ([500cec3](https://github.com/Hufe921/canvas-editor/commit/500cec3e0b63e012f6572dcedb071befa114956e)), closes [#755](https://github.com/Hufe921/canvas-editor/issues/755)
* set row flex boundary error when deleting element ([2f272de](https://github.com/Hufe921/canvas-editor/commit/2f272dee58169607783e4cfd1347534f49db0834))


### Features

* add location property to executeLocationControl api #753 ([d1a1aaa](https://github.com/Hufe921/canvas-editor/commit/d1a1aaa6ae08d8395df1df664d47bfe4fe821869)), closes [#753](https://github.com/Hufe921/canvas-editor/issues/753)
* add radio and checkbox vertical align setting ([c375466](https://github.com/Hufe921/canvas-editor/commit/c3754663cee25003a7021a6079dd46e2a3a0abd8))
* get context content width ([187498e](https://github.com/Hufe921/canvas-editor/commit/187498ed3dfba4386375d812d41b31c057ac3af8))



## [0.9.89](https://github.com/Hufe921/canvas-editor/compare/v0.9.88...v0.9.89) (2024-08-09)


### Bug Fixes

* three click selection paragraph boundary error #742 ([9dd192f](https://github.com/Hufe921/canvas-editor/commit/9dd192ffd26f9f271efa06c81b6bd5e32557d872)), closes [#742](https://github.com/Hufe921/canvas-editor/issues/742)


### Documentation

* update plugin markdown ([c2d3e94](https://github.com/Hufe921/canvas-editor/commit/c2d3e941b19a6bc766b0bfa8dac7911578170b6c))


### Features

* add id property to contextMenu context #737 ([997ecc0](https://github.com/Hufe921/canvas-editor/commit/997ecc03e89afeaaf6b903f9f253c5c5090b3f78)), closes [#737](https://github.com/Hufe921/canvas-editor/issues/737)
* add line number option #734 ([d89218a](https://github.com/Hufe921/canvas-editor/commit/d89218a916fce5a7b7b6bf27fa4663ecc4d15cf6)), closes [#734](https://github.com/Hufe921/canvas-editor/issues/734)
* control related apis support the control id property ([dd1b53e](https://github.com/Hufe921/canvas-editor/commit/dd1b53ee6297bc72b0064c09522b597118919c50))
* set range using the shift shortcut key #728 ([8878fd7](https://github.com/Hufe921/canvas-editor/commit/8878fd7734ae0a566f16ca2db14e64ded5a05f38)), closes [#728](https://github.com/Hufe921/canvas-editor/issues/728)



## [0.9.88](https://github.com/Hufe921/canvas-editor/compare/v0.9.87...v0.9.88) (2024-08-02)


### Bug Fixes

* float image position boundary error #716 ([f5113f5](https://github.com/Hufe921/canvas-editor/commit/f5113f539c5b224fdb9af8cde8e61f632dc7e49f)), closes [#716](https://github.com/Hufe921/canvas-editor/issues/716)


### Chores

* add touch support to signature component ([c3ef290](https://github.com/Hufe921/canvas-editor/commit/c3ef2907ae31be21cd3bc61a5600ad381230034f))
* update issue template ([eea301e](https://github.com/Hufe921/canvas-editor/commit/eea301eb11fdc3d5870da2408abccf4d96d8532f))


### Features

* add applyPageNumbers attribute to background option #729 ([8d112a8](https://github.com/Hufe921/canvas-editor/commit/8d112a8518656edd14201cb9bd16a417752fcdf9)), closes [#729](https://github.com/Hufe921/canvas-editor/issues/729)
* add cursor setting option to executeSetValue api #715 ([3235e5a](https://github.com/Hufe921/canvas-editor/commit/3235e5ae386bd1f48f5f64427e1eb0ed3782838d)), closes [#715](https://github.com/Hufe921/canvas-editor/issues/715)
* add title disabled property #680 ([87a8dbe](https://github.com/Hufe921/canvas-editor/commit/87a8dbea1596bcdee28edbb58b02fbe2a36e6c58)), closes [#680](https://github.com/Hufe921/canvas-editor/issues/680)



## [0.9.87](https://github.com/Hufe921/canvas-editor/compare/v0.9.86...v0.9.87) (2024-07-26)


### Bug Fixes

* format of checkbox and radio control value ([72686fd](https://github.com/Hufe921/canvas-editor/commit/72686fda1bf12353699fd57273493d8a9b4caee4))
* highlight checkbox and radio control #707 ([d939aa3](https://github.com/Hufe921/canvas-editor/commit/d939aa35ba7b19e5d1b5c4121fb873b2c579cc55)), closes [#707](https://github.com/Hufe921/canvas-editor/issues/707)
* set control highlight limit component type ([e14fbd6](https://github.com/Hufe921/canvas-editor/commit/e14fbd622d1076cba5f34bd4fa29530af4f70261))
* update punctuation width when scaling the page #712 ([83cb479](https://github.com/Hufe921/canvas-editor/commit/83cb47913195c43cde2b3ae344ff1d89a223e6a6)), closes [#712](https://github.com/Hufe921/canvas-editor/issues/712)
* word breaking when scaling the page #666 ([2bd1f34](https://github.com/Hufe921/canvas-editor/commit/2bd1f34c15196968f69d4711613f1c81f1dade68)), closes [#666](https://github.com/Hufe921/canvas-editor/issues/666)


### Features

* add custom field to getValue api #699 ([67c63f8](https://github.com/Hufe921/canvas-editor/commit/67c63f856f2c0e3e8c0644e39694357639c18d7e)), closes [#699](https://github.com/Hufe921/canvas-editor/issues/699)
* delete cell contents when selecting rows and columns #706 ([ccd0627](https://github.com/Hufe921/canvas-editor/commit/ccd0627a6fad975acb43e9f16dda3fa13972c908)), closes [#706](https://github.com/Hufe921/canvas-editor/issues/706)
* optimize text selection at the beginning of a line #695 ([97ac2da](https://github.com/Hufe921/canvas-editor/commit/97ac2daaf8f0688b181cb8baea9ba74ae1664361)), closes [#695](https://github.com/Hufe921/canvas-editor/issues/695)
* set control properties in read-only mode #679 ([26a3468](https://github.com/Hufe921/canvas-editor/commit/26a3468f66d67bf8249cdc1a679c740d7cf1a9c9)), closes [#679](https://github.com/Hufe921/canvas-editor/issues/679)
* set the container scrollbar to automatically scroll #711 ([b226566](https://github.com/Hufe921/canvas-editor/commit/b226566e2bf6f1b4bc3ae11577c7a96ae3cbf2d0)), closes [#711](https://github.com/Hufe921/canvas-editor/issues/711)



## [0.9.86](https://github.com/Hufe921/canvas-editor/compare/v0.9.85...v0.9.86) (2024-07-13)


### Bug Fixes

* add control placeholder boundary error #686 ([fac5c5c](https://github.com/Hufe921/canvas-editor/commit/fac5c5c045a30cb5e0c46ef027c83f21e07bcaa8)), closes [#686](https://github.com/Hufe921/canvas-editor/issues/686)
* add control placeholder using default style #691 ([eb3ea5e](https://github.com/Hufe921/canvas-editor/commit/eb3ea5ed55cdedea0e281d45177c8661f674a280)), closes [#691](https://github.com/Hufe921/canvas-editor/issues/691)
* delete table col boundary error #688 ([3f0a49f](https://github.com/Hufe921/canvas-editor/commit/3f0a49f56be7060d328a63c994f571b0a35a3521)), closes [#688](https://github.com/Hufe921/canvas-editor/issues/688)
* refocus when cursor is not focused #685 ([0ac8ae7](https://github.com/Hufe921/canvas-editor/commit/0ac8ae7c4b0b47ee84a9c0f8c37ffde612849957)), closes [#685](https://github.com/Hufe921/canvas-editor/issues/685)
* remove title and list properties from getControlList return value #683 ([b024050](https://github.com/Hufe921/canvas-editor/commit/b024050b3ef7f787079a74b062e5d83085be1a5f)), closes [#683](https://github.com/Hufe921/canvas-editor/issues/683)


### Features

* add executeInsertControl api ([e5b3d05](https://github.com/Hufe921/canvas-editor/commit/e5b3d05991a26dc186cdf63962ca3c7b50a32572))



## [0.9.85](https://github.com/Hufe921/canvas-editor/compare/v0.9.84...v0.9.85) (2024-07-07)


### Bug Fixes

* custom override method removes support for asynchronous #672 ([0e705d6](https://github.com/Hufe921/canvas-editor/commit/0e705d6a0bdb0922efd5c47edd8ca9eba9964199)), closes [#672](https://github.com/Hufe921/canvas-editor/issues/672)
* set control highlight and re render #678 ([24df9d3](https://github.com/Hufe921/canvas-editor/commit/24df9d3b006a8daf795ada677bfd0159e3ccc3f5)), closes [#678](https://github.com/Hufe921/canvas-editor/issues/678)


### Chores

* update build.yml ([a40441d](https://github.com/Hufe921/canvas-editor/commit/a40441dc3994a41ae29c341a542be6e0e7dada2e))


### Features

* add render mode #667 ([affd191](https://github.com/Hufe921/canvas-editor/commit/affd1911552a73a2b63a13f2c423121637830b99)), closes [#667](https://github.com/Hufe921/canvas-editor/issues/667)
* add title deletable property #670 ([b3d8413](https://github.com/Hufe921/canvas-editor/commit/b3d8413b35050eac626af1c57beaaf1b8d692a0e)), closes [#670](https://github.com/Hufe921/canvas-editor/issues/670)
* insert element boundary optimization #669 ([de44bd6](https://github.com/Hufe921/canvas-editor/commit/de44bd68ab01e5ffa8d6a8dc5d566b0cdb8d08e6)), closes [#669](https://github.com/Hufe921/canvas-editor/issues/669)


### Tests

* update text test case ([c24da73](https://github.com/Hufe921/canvas-editor/commit/c24da737b15200775a7d4a5edf4e2224f6ec5429))



## [0.9.84](https://github.com/Hufe921/canvas-editor/compare/v0.9.83...v0.9.84) (2024-06-30)


### Bug Fixes

* merge table cell boundary error #661 ([146ac75](https://github.com/Hufe921/canvas-editor/commit/146ac75a002338f13c96900a2849062c29018606)), closes [#661](https://github.com/Hufe921/canvas-editor/issues/661)
* set default style for control using executeSetControlProperties #658 ([7b5079c](https://github.com/Hufe921/canvas-editor/commit/7b5079c9b638730f7ea609239b3cb91b915d4650)), closes [#658](https://github.com/Hufe921/canvas-editor/issues/658)


### Features

* optimization of table operations in form mode #662 ([b740637](https://github.com/Hufe921/canvas-editor/commit/b74063741f413d5bf6f90c748761f64141405ca7)), closes [#662](https://github.com/Hufe921/canvas-editor/issues/662)
* override method with default interception behavior #663 ([9a4b4f9](https://github.com/Hufe921/canvas-editor/commit/9a4b4f9a4a70a344740212507e250d9bdea5dd32)), closes [#663](https://github.com/Hufe921/canvas-editor/issues/663)



## [0.9.83](https://github.com/Hufe921/canvas-editor/compare/v0.9.82...v0.9.83) (2024-06-21)


### Bug Fixes

* executeSetControlProperties api invalid in table #653 ([fdcf639](https://github.com/Hufe921/canvas-editor/commit/fdcf6397e1ce62ef1ed18a526a0642c3f120df3b)), closes [#653](https://github.com/Hufe921/canvas-editor/issues/653)


### Features

* add clear format attributes ([e21533a](https://github.com/Hufe921/canvas-editor/commit/e21533a3d1cfeecde562aaa6c52ee306e5063a01))
* add conceptId attribute to table td #654 ([959a062](https://github.com/Hufe921/canvas-editor/commit/959a062f830042b78af498e2d6cbc4e5f82fa3d4)), closes [#654](https://github.com/Hufe921/canvas-editor/issues/654)
* add mouse event listener #603 ([a2978bd](https://github.com/Hufe921/canvas-editor/commit/a2978bd1f507e9417b995bbb0b7ff756dbe5d2c4)), closes [#603](https://github.com/Hufe921/canvas-editor/issues/603)
* copy table structure and data #516 ([76c20a6](https://github.com/Hufe921/canvas-editor/commit/76c20a6b44914396ae7dd69a7c97db1b179937c2)), closes [#516](https://github.com/Hufe921/canvas-editor/issues/516)



## [0.9.82](https://github.com/Hufe921/canvas-editor/compare/v0.9.81...v0.9.82) (2024-06-14)


### Bug Fixes

* table cell merge boundary error #645 ([f7da332](https://github.com/Hufe921/canvas-editor/commit/f7da33235419aadb2aea024d3cba4444d6d719fd)), closes [#645](https://github.com/Hufe921/canvas-editor/issues/645)


### Features

* add executeUpdateElementById api #648 ([5c896bf](https://github.com/Hufe921/canvas-editor/commit/5c896bf95814c6ef2956221763e7df560b3fe98a)), closes [#648](https://github.com/Hufe921/canvas-editor/issues/648)
* add override internal drop function api #643 ([ec7e076](https://github.com/Hufe921/canvas-editor/commit/ec7e0760c113711fdafc13374ea521605308f867)), closes [#643](https://github.com/Hufe921/canvas-editor/issues/643)
* move control position by dragging #456 ([cdb0788](https://github.com/Hufe921/canvas-editor/commit/cdb0788dfcecadb70e680eb40a31551e0e096401)), closes [#456](https://github.com/Hufe921/canvas-editor/issues/456)



## [0.9.81](https://github.com/Hufe921/canvas-editor/compare/v0.9.80...v0.9.81) (2024-06-07)


### Bug Fixes

* disable zone tip in continuous page mode #638 ([bf322df](https://github.com/Hufe921/canvas-editor/commit/bf322dfea334ee242a452c44fdb613a1937d963b)), closes [#638](https://github.com/Hufe921/canvas-editor/issues/638)
* some shortcut keys with shift are invalid #629 ([aca9d34](https://github.com/Hufe921/canvas-editor/commit/aca9d34a46004f2da207f7127f69430e4e59ab25)), closes [#629](https://github.com/Hufe921/canvas-editor/issues/629)


### Documentation

* update start.md ([55bbe22](https://github.com/Hufe921/canvas-editor/commit/55bbe22578320319d9ab38b26ebbe8687b21f1c1))


### Features

* add executeLocationControl api #592 ([53701fc](https://github.com/Hufe921/canvas-editor/commit/53701fc46c347595722801e8bca40647cda74bcb)), closes [#592](https://github.com/Hufe921/canvas-editor/issues/592)
* add maximum page number option #617 ([afce688](https://github.com/Hufe921/canvas-editor/commit/afce6882493c198595a0575640dd313c8cbdb14f)), closes [#617](https://github.com/Hufe921/canvas-editor/issues/617)
* add options to the getValue api ([65acd58](https://github.com/Hufe921/canvas-editor/commit/65acd580d6813bd15b8ee079b16ae8d5f9e77767))
* add selection info to rangeContext ([2df03ed](https://github.com/Hufe921/canvas-editor/commit/2df03ed3867cf8edf5fb656c017986af6725780c))
* set title style through executeSetHtml api #626 ([ac795b0](https://github.com/Hufe921/canvas-editor/commit/ac795b0bc45f99e92a5292a676414e1d7347cb7e)), closes [#626](https://github.com/Hufe921/canvas-editor/issues/626)


### Tests

* update watermark test case ([c75482a](https://github.com/Hufe921/canvas-editor/commit/c75482a4f6f18da010963500e790780a63c061c4))



## [0.9.80](https://github.com/Hufe921/canvas-editor/compare/v0.9.79...v0.9.80) (2024-05-31)


### Bug Fixes

* boundary error when deleting elements backwards #606 ([5006264](https://github.com/Hufe921/canvas-editor/commit/500626498f6c5088d3b998f615c25e8873021d8a)), closes [#606](https://github.com/Hufe921/canvas-editor/issues/606)
* cursor position outside the margin of the page #609 ([d16b0f4](https://github.com/Hufe921/canvas-editor/commit/d16b0f46facc7155e74cd06bf019725c5cac2a82)), closes [#609](https://github.com/Hufe921/canvas-editor/issues/609)
* error using tab key at control postfix ([bb1ee59](https://github.com/Hufe921/canvas-editor/commit/bb1ee5910e7caa0b54ea721038571210950eb59c))
* get controls within the table #628 ([2af0847](https://github.com/Hufe921/canvas-editor/commit/2af0847f555af5491640b7a8a650ec57fb309a2c)), closes [#628](https://github.com/Hufe921/canvas-editor/issues/628)
* not copy control postfix style #631 ([523183f](https://github.com/Hufe921/canvas-editor/commit/523183f1751be898f5f9e0f84e31b73be46a9430)), closes [#631](https://github.com/Hufe921/canvas-editor/issues/631)


### Chores

* add date control demo ([b08dba0](https://github.com/Hufe921/canvas-editor/commit/b08dba0e967485a8875db993344f7a87571ee080))


### Features

* add date control #601 ([3989199](https://github.com/Hufe921/canvas-editor/commit/398919938f947aea96008a55af059bf5ae4dc768)), closes [#601](https://github.com/Hufe921/canvas-editor/issues/601)
* add executeInsertTitle api #604 ([2659d6b](https://github.com/Hufe921/canvas-editor/commit/2659d6bde7b2ce7f221f93e5fcb4d4bef0f83d54)), closes [#604](https://github.com/Hufe921/canvas-editor/issues/604)
* delete image using the delete key #614 ([d54a701](https://github.com/Hufe921/canvas-editor/commit/d54a701adb435c617ff7877561fc4f265673a409)), closes [#614](https://github.com/Hufe921/canvas-editor/issues/614)



## [0.9.79](https://github.com/Hufe921/canvas-editor/compare/v0.9.78...v0.9.79) (2024-05-25)


### Bug Fixes

* control setting row flex data error #586 ([8f36d1f](https://github.com/Hufe921/canvas-editor/commit/8f36d1fb4f161bd125d0c8a8ac72590df2d2aefe)), closes [#586](https://github.com/Hufe921/canvas-editor/issues/586)
* drawing size error when browser scale page #594 ([7fa58f8](https://github.com/Hufe921/canvas-editor/commit/7fa58f8290bd368dc70fc5c568bea7c2b7385bd1)), closes [#594](https://github.com/Hufe921/canvas-editor/issues/594)
* export HTML block elements row flex error #598 ([4cd18c8](https://github.com/Hufe921/canvas-editor/commit/4cd18c8c65b6954bf2029b165e2749640feb15c3)), closes [#598](https://github.com/Hufe921/canvas-editor/issues/598)
* resizer position error when crossing pages #591 ([f4dd90b](https://github.com/Hufe921/canvas-editor/commit/f4dd90bbc517af8a89d707973e49032fbf320232)), closes [#591](https://github.com/Hufe921/canvas-editor/issues/591)
* set non deletable control value boundary error #595 ([bcf311f](https://github.com/Hufe921/canvas-editor/commit/bcf311ff19557764eb82294c211d2e0e22c55ff1)), closes [#595](https://github.com/Hufe921/canvas-editor/issues/595)
* update cursor status after setting page mode #588 ([28596c8](https://github.com/Hufe921/canvas-editor/commit/28596c889f1b1d49dfd246d7f7f6c4046483c8eb)), closes [#588](https://github.com/Hufe921/canvas-editor/issues/588)


### Features

* add externalId property to element #552 ([6525522](https://github.com/Hufe921/canvas-editor/commit/65255229c548c2646b70d1de8b25f89a5b6b46f7)), closes [#552](https://github.com/Hufe921/canvas-editor/issues/552)
* move between controls using shortcut keys #548 ([c6c2f98](https://github.com/Hufe921/canvas-editor/commit/c6c2f981497224cc95dbdd50ee9552683bc1df6f)), closes [#548](https://github.com/Hufe921/canvas-editor/issues/548)
* split text support multiple languages #593 ([1cb07af](https://github.com/Hufe921/canvas-editor/commit/1cb07af75ec4cff03f4562ea917175d91d55852e)), closes [#593](https://github.com/Hufe921/canvas-editor/issues/593)


### Performance Improvements

* adaptive size when the image is larger than the page width #599 ([b8323c0](https://github.com/Hufe921/canvas-editor/commit/b8323c0d8af01750e954ab49b7fe462844096d5a)), closes [#599](https://github.com/Hufe921/canvas-editor/issues/599)



## [0.9.78](https://github.com/Hufe921/canvas-editor/compare/v0.9.77...v0.9.78) (2024-05-18)


### Bug Fixes

* disable line break drawing in print and clean mode ([fc55e55](https://github.com/Hufe921/canvas-editor/commit/fc55e557dad94754be56a174eee54a1a76d86a56))
* drag image resizer position error #567 ([1e669a6](https://github.com/Hufe921/canvas-editor/commit/1e669a6f03b9011c68366348313bfd79d154633d)), closes [#567](https://github.com/Hufe921/canvas-editor/issues/567)
* dragging to adjust td width boundary error #569 ([2738d3a](https://github.com/Hufe921/canvas-editor/commit/2738d3ae4cef76aa9a7d85ab1ab2d925ba0df5f8)), closes [#569](https://github.com/Hufe921/canvas-editor/issues/569)
* first row height boundary error #563 ([6ada65e](https://github.com/Hufe921/canvas-editor/commit/6ada65e7680b8ca71657bc643f0eb807d9b78f5f)), closes [#563](https://github.com/Hufe921/canvas-editor/issues/563)
* justify row flex boundary error #577 ([d49ed5e](https://github.com/Hufe921/canvas-editor/commit/d49ed5ea4337dc03b534b97c774b77769f1b04bc)), closes [#577](https://github.com/Hufe921/canvas-editor/issues/577)
* re render when the page is visible #578 ([24aa33a](https://github.com/Hufe921/canvas-editor/commit/24aa33a4f16282812caa16d5666bbd7f57517c7c)), closes [#578](https://github.com/Hufe921/canvas-editor/issues/578)
* wake up pop-up controls #580 ([28f6bdb](https://github.com/Hufe921/canvas-editor/commit/28f6bdbb4114f0f8b693b7688ae0b175368d491c)), closes [#580](https://github.com/Hufe921/canvas-editor/issues/580)


### Features

* add executeUpdateOptions api #571 ([3175bad](https://github.com/Hufe921/canvas-editor/commit/3175bad5e70e9ac2143a1101c9e3e674cc793b69)), closes [#571](https://github.com/Hufe921/canvas-editor/issues/571)
* add table context to contextmenu and getRangeContext api #576 ([149c95f](https://github.com/Hufe921/canvas-editor/commit/149c95f9522a9832bcf91ec259fd40f146ff80c3)), closes [#576](https://github.com/Hufe921/canvas-editor/issues/576)



## [0.9.77](https://github.com/Hufe921/canvas-editor/compare/v0.9.76...v0.9.77) (2024-05-11)


### Bug Fixes

* delete control placeholder boundary error #553 ([73e47f5](https://github.com/Hufe921/canvas-editor/commit/73e47f56b54dfc2e8dbbe1e167b1cf868684b38c)), closes [#553](https://github.com/Hufe921/canvas-editor/issues/553)
* image resizer position boundary error #538 ([9f37995](https://github.com/Hufe921/canvas-editor/commit/9f37995a23e5655ee9011e19ce7b7aed1f9298eb)), closes [#538](https://github.com/Hufe921/canvas-editor/issues/538)
* move cursor boundary error with up and down keys #556 ([d58b28c](https://github.com/Hufe921/canvas-editor/commit/d58b28c1dbe47a7a4970b4333c0846fafbf511db)), closes [#556](https://github.com/Hufe921/canvas-editor/issues/556)
* subscript and superscript strikeout rendering ([62c94fc](https://github.com/Hufe921/canvas-editor/commit/62c94fce59c206b87dc68d0ed9d74f036cde956f))
* subscript underline rendering position #537 ([745a098](https://github.com/Hufe921/canvas-editor/commit/745a098a707893cc7ae8ba812ab11f826b961d55)), closes [#537](https://github.com/Hufe921/canvas-editor/issues/537)


### Features

* table header appears repeatedly when paging #541 ([c86e546](https://github.com/Hufe921/canvas-editor/commit/c86e5468e666c64c087a430af8a9a8307b837f0f)), closes [#541](https://github.com/Hufe921/canvas-editor/issues/541)


### Performance Improvements

* control operation history boundary #540 ([24c5b74](https://github.com/Hufe921/canvas-editor/commit/24c5b74bf2196ce3a1c76d0cf5626cd249a2a5fd)), closes [#540](https://github.com/Hufe921/canvas-editor/issues/540)



## [0.9.76](https://github.com/Hufe921/canvas-editor/compare/v0.9.75...v0.9.76) (2024-05-04)


### Bug Fixes

* checkbox custom size rendering error #529 ([5a5fd64](https://github.com/Hufe921/canvas-editor/commit/5a5fd64176de288c7d0e02ab4cbbc2607dc3df20)), closes [#529](https://github.com/Hufe921/canvas-editor/issues/529)
* copy style after title line break #531 ([2e14035](https://github.com/Hufe921/canvas-editor/commit/2e1403507f593d6c827f6be6d0cb75c5a1615e62)), closes [#531](https://github.com/Hufe921/canvas-editor/issues/531)
* paste elements boundary error ([34d59bb](https://github.com/Hufe921/canvas-editor/commit/34d59bbb589b9bb38c74f00b66b734b6342dd440))


### Chores

* update radio menu icon ([0ae67ec](https://github.com/Hufe921/canvas-editor/commit/0ae67ec602df9c224ad134bff63b51f66d71aff7))


### Features

* add getTitleValue api #536 ([15f52c5](https://github.com/Hufe921/canvas-editor/commit/15f52c5e43a733657e6079c7112bb9df3a8d5aa6)), closes [#536](https://github.com/Hufe921/canvas-editor/issues/536)
* add justify-all property to row flex #535 ([a1293af](https://github.com/Hufe921/canvas-editor/commit/a1293aff228595cafe2c730d9fb5dbdb1241c3d8)), closes [#535](https://github.com/Hufe921/canvas-editor/issues/535)
* add radio element #494 ([c6d9cff](https://github.com/Hufe921/canvas-editor/commit/c6d9cffc275ab4114a1c9a3ce931dc0843cb5585)), closes [#494](https://github.com/Hufe921/canvas-editor/issues/494)
* add separator option #530 ([7416a88](https://github.com/Hufe921/canvas-editor/commit/7416a881515a443a5736a673cd12732d44d65264)), closes [#530](https://github.com/Hufe921/canvas-editor/issues/530)



## [0.9.75](https://github.com/Hufe921/canvas-editor/compare/v0.9.74...v0.9.75) (2024-04-27)


### Bug Fixes

* control element rendering boundary error in table #527 ([f41cea2](https://github.com/Hufe921/canvas-editor/commit/f41cea244309e98ca880c74aaa4e0f3a2811ad66)), closes [#527](https://github.com/Hufe921/canvas-editor/issues/527)
* list position error when setting row flex #523 ([3fdd4de](https://github.com/Hufe921/canvas-editor/commit/3fdd4dedf434a45ded0c7114cf1cd0c8a1e94a18)), closes [#523](https://github.com/Hufe921/canvas-editor/issues/523)
* search for duplicate keyword boundary error #528 ([d4c6cd2](https://github.com/Hufe921/canvas-editor/commit/d4c6cd25f639ea5d933e2c4a2d006c96e3138219)), closes [#528](https://github.com/Hufe921/canvas-editor/issues/528)
* word break boundary error #521 ([4d1a0b6](https://github.com/Hufe921/canvas-editor/commit/4d1a0b69f876eada2d0c5d866bd25464d2587a79)), closes [#521](https://github.com/Hufe921/canvas-editor/issues/521)


### Chores

* add editor option settings in the demo ([07956ca](https://github.com/Hufe921/canvas-editor/commit/07956caec20eea75c994e968429028ebcfb174f4))


### Features

* draw line break marker #520 ([4c2b8fc](https://github.com/Hufe921/canvas-editor/commit/4c2b8fc20af98533796d5c4fec0d8d0c3d876116)), closes [#520](https://github.com/Hufe921/canvas-editor/issues/520)



## [0.9.74](https://github.com/Hufe921/canvas-editor/compare/v0.9.73...v0.9.74) (2024-04-19)


### Bug Fixes

* control component disabling segmenter ([868a791](https://github.com/Hufe921/canvas-editor/commit/868a79148d8e68ba1b34ddd8d37941e3e26988d7))
* delete default control color property #513 ([224ead0](https://github.com/Hufe921/canvas-editor/commit/224ead0dff28f333e04bfb7c7ba4068d32670e52)), closes [#513](https://github.com/Hufe921/canvas-editor/issues/513)
* disable control placeholder selection #511 ([2985d6b](https://github.com/Hufe921/canvas-editor/commit/2985d6b62ee5311a5f8350282f313e9faca95204)), closes [#511](https://github.com/Hufe921/canvas-editor/issues/511)


### Features

* add control border #388 ([de06f6c](https://github.com/Hufe921/canvas-editor/commit/de06f6cc9b2d3f37033647cf159bb9c09a432c1b)), closes [#388](https://github.com/Hufe921/canvas-editor/issues/388)
* add extension property ([5027d73](https://github.com/Hufe921/canvas-editor/commit/5027d730c4522d496ef933830df026960077e660))
* add security rules to IFrameBlock element ([cdbd1ff](https://github.com/Hufe921/canvas-editor/commit/cdbd1ff4ded52a588d837c3b2cb04fe6168ed51f))
* add srcdoc property to IFrameBlock element #454 ([6696992](https://github.com/Hufe921/canvas-editor/commit/66969925ac5193b5a2b0e227df247052cf79364f)), closes [#454](https://github.com/Hufe921/canvas-editor/issues/454)
* control default style #340 ([eee2236](https://github.com/Hufe921/canvas-editor/commit/eee22363d3a0de8333a6b6f8815ef178fbfc3c8d)), closes [#340](https://github.com/Hufe921/canvas-editor/issues/340)
* record the first cursor position #517 ([0878506](https://github.com/Hufe921/canvas-editor/commit/087850606224290bc6e1992711416ac0acbfa45b)), closes [#517](https://github.com/Hufe921/canvas-editor/issues/517)


### Tests

* update block test case ([6d358d1](https://github.com/Hufe921/canvas-editor/commit/6d358d16dc2eb1af309c554c369f30a805451acc))



## [0.9.73](https://github.com/Hufe921/canvas-editor/compare/v0.9.72...v0.9.73) (2024-04-12)


### Bug Fixes

* add context param to the shrinkBoundary function #503 ([6f690a8](https://github.com/Hufe921/canvas-editor/commit/6f690a805ff385ce4e6ed3959285ceeb730567bf)), closes [#503](https://github.com/Hufe921/canvas-editor/issues/503)
* checkbox list cannot be selected within the table ([632f8f5](https://github.com/Hufe921/canvas-editor/commit/632f8f5af8d626d28a306c212419565bf216c997))
* disable table pagination in continuous page mode ([d0500ac](https://github.com/Hufe921/canvas-editor/commit/d0500ac58345b689bd3f331342e7c08ca1684094))
* format list elements boundary error ([21807a6](https://github.com/Hufe921/canvas-editor/commit/21807a6f7e7b73adf0696ea848fb0b7ebdbf14ea))


### Chores

* upgrade typescript version ([7e5a1ac](https://github.com/Hufe921/canvas-editor/commit/7e5a1ac04c1866ceb6b27131d7b2cf7f5fa46fe4))


### Features

* add checkbox list #385 ([a546262](https://github.com/Hufe921/canvas-editor/commit/a546262b9d7e94011565198e0f18e7671b5439b0)), closes [#385](https://github.com/Hufe921/canvas-editor/issues/385)
* double click the selected text through the segmenter #510 ([3f8399d](https://github.com/Hufe921/canvas-editor/commit/3f8399de6299331c07e3d7c3c8d16dee64528d4a)), closes [#510](https://github.com/Hufe921/canvas-editor/issues/510)
* the getText method add list style conversion ([f80e004](https://github.com/Hufe921/canvas-editor/commit/f80e004917d53cbb3868c940c26d94f85d0d8615))
* the getText method add tab conversion #507 ([762f10c](https://github.com/Hufe921/canvas-editor/commit/762f10c37729a2d51dd3a79e6f3b8c9e3134926b)), closes [#507](https://github.com/Hufe921/canvas-editor/issues/507)



## [0.9.72](https://github.com/Hufe921/canvas-editor/compare/v0.9.71...v0.9.72) (2024-04-06)


### Bug Fixes

* cannot page when merge cells across columns in the same row #41 ([5851e61](https://github.com/Hufe921/canvas-editor/commit/5851e61cfcbb14fa199b507dc429917075659161)), closes [#41](https://github.com/Hufe921/canvas-editor/issues/41)
* format text class elements boundary error ([95b337d](https://github.com/Hufe921/canvas-editor/commit/95b337de05df74a07d086dbec6c6c52ab95ba43a))
* strikeout style rendering position #498 ([46e153d](https://github.com/Hufe921/canvas-editor/commit/46e153d588e78302e26827461a06682bbccd75aa)), closes [#498](https://github.com/Hufe921/canvas-editor/issues/498)
* table range drawing boundary error ([1df98b9](https://github.com/Hufe921/canvas-editor/commit/1df98b9359f3ec4184a7045cfcea93e156ef7f9f))


### Features

* add isTable property to the RangeContext interface ([9ad991a](https://github.com/Hufe921/canvas-editor/commit/9ad991a3934fc284bb829d2652a739cfbec80eee))



## [0.9.71](https://github.com/Hufe921/canvas-editor/compare/v0.9.70...v0.9.71) (2024-03-29)


### Bug Fixes

* adjust the order of rich text rendering ([7458a9f](https://github.com/Hufe921/canvas-editor/commit/7458a9fd2036819a5646d7cf5563f03d1e7ce48b))
* cannot deletable elements boundary error #491 ([291ea26](https://github.com/Hufe921/canvas-editor/commit/291ea26b06c39b6649dbc6fff2fdb75748756556)), closes [#491](https://github.com/Hufe921/canvas-editor/issues/491)
* control front and back operation boundary error ([1bb7a58](https://github.com/Hufe921/canvas-editor/commit/1bb7a58f5eaee8d09fadecbd1ee8717dd2763086))
* punctuation symbols rendered separately ([d91b47c](https://github.com/Hufe921/canvas-editor/commit/d91b47cee540f562647e0d84ec04191a65945123))


### Features

* move between table cells using up and down keys #465 ([2de1ba7](https://github.com/Hufe921/canvas-editor/commit/2de1ba7b62cc04307abeaec78b61516db41a71aa)), closes [#465](https://github.com/Hufe921/canvas-editor/issues/465)



## [0.9.70](https://github.com/Hufe921/canvas-editor/compare/v0.9.69...v0.9.70) (2024-03-22)


### Bug Fixes

* clear draw side effects when set zone ([169864f](https://github.com/Hufe921/canvas-editor/commit/169864f040924aded054a6ca174ab0e074cb6984))
* header and footer floating image error #473 ([f14b863](https://github.com/Hufe921/canvas-editor/commit/f14b8635c25ccf176f3dfd23afc082a37b89aca6)), closes [#473](https://github.com/Hufe921/canvas-editor/issues/473)
* paste list element boundary error #487 ([3796cab](https://github.com/Hufe921/canvas-editor/commit/3796cabb377247541b39b24a9f25c5db9c856d64)), closes [#487](https://github.com/Hufe921/canvas-editor/issues/487)
* table border style lost when exporting HTML #480 ([b6758a6](https://github.com/Hufe921/canvas-editor/commit/b6758a63e651690c9a7797cbd7dfbfabf6aa51e6)), closes [#480](https://github.com/Hufe921/canvas-editor/issues/480)


### Chores

* update build.yml ([056648d](https://github.com/Hufe921/canvas-editor/commit/056648dd5ccf6bbf62f845ca66ee05a00cbc9d86))


### Features

* move between table cells using left and right keys #465 ([83f37ed](https://github.com/Hufe921/canvas-editor/commit/83f37edbca80ca5df5349c9c24639528107846ef)), closes [#465](https://github.com/Hufe921/canvas-editor/issues/465)
* table element paging across multiple pages #41 ([01b1104](https://github.com/Hufe921/canvas-editor/commit/01b1104de47fcdbb61d8e81e25047c2560d8b086)), closes [#41](https://github.com/Hufe921/canvas-editor/issues/41)


### Performance Improvements

* floating image initial position #484 ([9d2ee3a](https://github.com/Hufe921/canvas-editor/commit/9d2ee3a6407052b18e9556a020197509ef1ae5b3)), closes [#484](https://github.com/Hufe921/canvas-editor/issues/484)


### Refactor

* keydown event code structure ([0ff6c2f](https://github.com/Hufe921/canvas-editor/commit/0ff6c2fd1f8c1e58973f557a4621cb36cb8d26c4))



## [0.9.69](https://github.com/Hufe921/canvas-editor/compare/v0.9.68...v0.9.69) (2024-03-15)


### Bug Fixes

* adjust the style of converting table element to html #458 ([0003686](https://github.com/Hufe921/canvas-editor/commit/000368636cba3547e3b280e1960e72198b41cb01)), closes [#458](https://github.com/Hufe921/canvas-editor/issues/458)
* copy html boundary error #470 ([4e46afa](https://github.com/Hufe921/canvas-editor/commit/4e46afab687c696360a96f45dd3cd97551f951ec)), closes [#470](https://github.com/Hufe921/canvas-editor/issues/470)


### Features

* add getControlList api #455 ([0523fc2](https://github.com/Hufe921/canvas-editor/commit/0523fc257ae6f2c9b2511e912a4272c6b962d41e)), closes [#455](https://github.com/Hufe921/canvas-editor/issues/455)
* add parameter for clearing font color and highlight color #461 ([73f9cfd](https://github.com/Hufe921/canvas-editor/commit/73f9cfdf88afcfab4376bf3c4011b171c0669d2f)), closes [#461](https://github.com/Hufe921/canvas-editor/issues/461)
* cancel painter style setting #453 ([51427c7](https://github.com/Hufe921/canvas-editor/commit/51427c7dc462ea5a33ae6a92836d1e7ded7cf43d)), closes [#453](https://github.com/Hufe921/canvas-editor/issues/453)
* table element can be merged after paging #41 ([33a2dd8](https://github.com/Hufe921/canvas-editor/commit/33a2dd8faa7a46bc9290b744dad93a761ed6e1cf)), closes [#41](https://github.com/Hufe921/canvas-editor/issues/41)


### Refactor

* date element renderer #460 ([788f96a](https://github.com/Hufe921/canvas-editor/commit/788f96aa89766cecf0e835fd0ffe64140bb94e87)), closes [#460](https://github.com/Hufe921/canvas-editor/issues/460)


### Tests

* update painter test case (#459) ([a058c59](https://github.com/Hufe921/canvas-editor/commit/a058c5956cc2c26b347e5528d8164e2e1eff1225)), closes [#459](https://github.com/Hufe921/canvas-editor/issues/459)



## [0.9.68](https://github.com/Hufe921/canvas-editor/compare/v0.9.67...v0.9.68) (2024-03-10)


### Bug Fixes

* dragging element boundary error ([a2d8dd5](https://github.com/Hufe921/canvas-editor/commit/a2d8dd55b36a09b42fae377e06bf667dced3857e))
* hyperlink word count statistics #449 ([180bd08](https://github.com/Hufe921/canvas-editor/commit/180bd088397159e32dc70da4eefd507721ced432)), closes [#449](https://github.com/Hufe921/canvas-editor/issues/449)


### Features

* set print layout format when printing #448 ([c6534f7](https://github.com/Hufe921/canvas-editor/commit/c6534f766d8640cbea4e441541065d25e0dd8b82)), closes [#448](https://github.com/Hufe921/canvas-editor/issues/448)


### Performance Improvements

* history stack memory ([5044c31](https://github.com/Hufe921/canvas-editor/commit/5044c319211322c0ab2a2db461b029f34b292939))



## [0.9.67](https://github.com/Hufe921/canvas-editor/compare/v0.9.66...v0.9.67) (2024-03-01)


### Bug Fixes

* dragging image boundary error within the control ([52590f6](https://github.com/Hufe921/canvas-editor/commit/52590f6d92746e30aaf92efe85b0486ddd3cb467))
* text control clear value range context error #439 (#443) ([c299290](https://github.com/Hufe921/canvas-editor/commit/c2992909b6c7ff94d6685007d09fa9611b5e6d8d)), closes [#439](https://github.com/Hufe921/canvas-editor/issues/439) [#443](https://github.com/Hufe921/canvas-editor/issues/443)


### Chores

* add underline decoration type demo ([aa12296](https://github.com/Hufe921/canvas-editor/commit/aa12296ef67aa66e46d6615e91833199746c8bae))
* update FUNDING.yml ([dc2804c](https://github.com/Hufe921/canvas-editor/commit/dc2804c492b1d5d745ec58276e4ff8bc1ed825b3))


### Features

* add text decoration property ([f1570f2](https://github.com/Hufe921/canvas-editor/commit/f1570f2180086c1d4f9bf92e06edf5baecbd436c))
* add textDecoration property to the rangeStyleChange event ([a7fa847](https://github.com/Hufe921/canvas-editor/commit/a7fa847b198010cc5c7b8af9c860a04fe1c4250d))



## [0.9.66](https://github.com/Hufe921/canvas-editor/compare/v0.9.65...v0.9.66) (2024-02-24)


### Bug Fixes

* disable automatic selection when double clicking the checkbox ([72a22b5](https://github.com/Hufe921/canvas-editor/commit/72a22b5e619ea0308af8d2c06d9afb5d2c8e81f2))
* get catalog text filtering element types ([36477d2](https://github.com/Hufe921/canvas-editor/commit/36477d23a3caf234a1165a784ebf7d0451fefa01))
* latex element preview rendering boundary error ([6f0ab64](https://github.com/Hufe921/canvas-editor/commit/6f0ab649cd49c6f0272da9d12b1ac9ab8b6a262e))
* richtext elements boundary render error ([956035b](https://github.com/Hufe921/canvas-editor/commit/956035b0e308db5129ea461fae868343723cede7))


### Features

* dragging image element to adjust position #404 ([9428148](https://github.com/Hufe921/canvas-editor/commit/9428148f42fdd1828af69de9e9a3be30c6191796)), closes [#404](https://github.com/Hufe921/canvas-editor/issues/404)
* image element floating #363 ([b357a57](https://github.com/Hufe921/canvas-editor/commit/b357a57dfd15e20abdc275e2be148977cb73889c)), closes [#363](https://github.com/Hufe921/canvas-editor/issues/363)
* table td with multiple border types #435 ([1d4987e](https://github.com/Hufe921/canvas-editor/commit/1d4987ea670ffbd254d040cf93019c1d3b5f0765)), closes [#435](https://github.com/Hufe921/canvas-editor/issues/435)
* table td with multiple slash types #436 ([5b52bb8](https://github.com/Hufe921/canvas-editor/commit/5b52bb8794b96a9f9460fe65cf4c2467e8790299)), closes [#436](https://github.com/Hufe921/canvas-editor/issues/436)



## [0.9.65](https://github.com/Hufe921/canvas-editor/compare/v0.9.64...v0.9.65) (2024-02-06)


### Bug Fixes

* cursor position error when scaling the page #434 ([e03feb2](https://github.com/Hufe921/canvas-editor/commit/e03feb210282779ecebb7af3d9a3801392b66979)), closes [#434](https://github.com/Hufe921/canvas-editor/issues/434)
* insert image render error when scaling the page #433 ([acb0d3f](https://github.com/Hufe921/canvas-editor/commit/acb0d3fc47953c822b2daa5b1b437780a2c0f67e)), closes [#433](https://github.com/Hufe921/canvas-editor/issues/433)


### Features

* add getRange api #429 ([2a6a41c](https://github.com/Hufe921/canvas-editor/commit/2a6a41c8c9ebe8188de08d43f10db89c77016950)), closes [#429](https://github.com/Hufe921/canvas-editor/issues/429)
* paste original elements by api ([7ab103e](https://github.com/Hufe921/canvas-editor/commit/7ab103edd9c3dbfa3c94b31167fc68487656a4d0))
* set margin style when printing #431 ([4015707](https://github.com/Hufe921/canvas-editor/commit/4015707025689648be2d3082dfbcbe2e597b55d1)), closes [#431](https://github.com/Hufe921/canvas-editor/issues/431)



## [0.9.64](https://github.com/Hufe921/canvas-editor/compare/v0.9.63...v0.9.64) (2024-01-28)


### Bug Fixes

* error inserting image within control #422 ([ea4ac33](https://github.com/Hufe921/canvas-editor/commit/ea4ac339c7de962845f639a1c5ac24d8e3640485)), closes [#422](https://github.com/Hufe921/canvas-editor/issues/422)
* render error when row element is empty #420 ([8999f28](https://github.com/Hufe921/canvas-editor/commit/8999f283bb87d92fe58b1aa8330bf4d9d75b9064)), closes [#420](https://github.com/Hufe921/canvas-editor/issues/420)
* zone tip position error in firefox browser #423 ([3cf911c](https://github.com/Hufe921/canvas-editor/commit/3cf911c501a0c0af85d994d5b50c657c6cd77692)), closes [#423](https://github.com/Hufe921/canvas-editor/issues/423)


### Features

* add executeSetControlProperties api #391 ([3ffb6b9](https://github.com/Hufe921/canvas-editor/commit/3ffb6b94b57a0d0fe81cc778a26d4e2a234e24ab)), closes [#391](https://github.com/Hufe921/canvas-editor/issues/391)
* copy and paste original elements #397 (#426) ([2fc16de](https://github.com/Hufe921/canvas-editor/commit/2fc16de4e15578cdd181c4186b4cf978924b5207)), closes [#397](https://github.com/Hufe921/canvas-editor/issues/397) [#426](https://github.com/Hufe921/canvas-editor/issues/426)



## [0.9.63](https://github.com/Hufe921/canvas-editor/compare/v0.9.62...v0.9.63) (2024-01-19)


### Bug Fixes

* copy row properties on input #415 ([55a43e6](https://github.com/Hufe921/canvas-editor/commit/55a43e61bf6aded9f50644e86d3a1c276ee7a53a)), closes [#415](https://github.com/Hufe921/canvas-editor/issues/415)
* format list element boundary error ([094af57](https://github.com/Hufe921/canvas-editor/commit/094af57302a7db0c83cb3dd8a5eb9bbe5581b8f8))
* image render error within the control #406 ([d175f92](https://github.com/Hufe921/canvas-editor/commit/d175f920e8887cc3b1f5132e8ac7443b0d556204)), closes [#406](https://github.com/Hufe921/canvas-editor/issues/406)


### Features

* keep aspect ratio when drag image #414 ([e8684da](https://github.com/Hufe921/canvas-editor/commit/e8684daffd40a8efda0342809846451afa0027a2)), closes [#414](https://github.com/Hufe921/canvas-editor/issues/414)



## [0.9.62](https://github.com/Hufe921/canvas-editor/compare/v0.9.61...v0.9.62) (2024-01-12)


### Bug Fixes

* control minimum width rendering boundary error #401 ([5272c85](https://github.com/Hufe921/canvas-editor/commit/5272c85bbe9a723886506363e3ff4f51c2c6a941)), closes [#401](https://github.com/Hufe921/canvas-editor/issues/401)
* disable zone tips when header and footer disabled #386 ([531750b](https://github.com/Hufe921/canvas-editor/commit/531750bb44844c31f2ea140078e68964a7c50923)), closes [#386](https://github.com/Hufe921/canvas-editor/issues/386)


### Features

* add background image option ([eadf7f6](https://github.com/Hufe921/canvas-editor/commit/eadf7f6e49df4534a49f3e7c263c2caca96b3c3a))
* add defaultColor option #405 ([a324ecc](https://github.com/Hufe921/canvas-editor/commit/a324ecc417fd2993ecdc22fc6d4299178d27de60)), closes [#405](https://github.com/Hufe921/canvas-editor/issues/405)
* add table cell border type #389 ([3253f37](https://github.com/Hufe921/canvas-editor/commit/3253f3708e50220828cd26dc129ba6bd448a2ad0)), closes [#389](https://github.com/Hufe921/canvas-editor/issues/389)
* copy style information when wrapping #384 ([981e458](https://github.com/Hufe921/canvas-editor/commit/981e4582f91b87a23afde67c0e401ff71dc42b21)), closes [#384](https://github.com/Hufe921/canvas-editor/issues/384)
* support drop images #398 (#402) ([a96d239](https://github.com/Hufe921/canvas-editor/commit/a96d2390365c6fe058e15b654bf5589373214109)), closes [#398](https://github.com/Hufe921/canvas-editor/issues/398) [#402](https://github.com/Hufe921/canvas-editor/issues/402)


### Tests

* update format test case ([f9edf73](https://github.com/Hufe921/canvas-editor/commit/f9edf731a2a4a4a421636a512dfe41071d86b9ba))



## [0.9.61](https://github.com/Hufe921/canvas-editor/compare/v0.9.60...v0.9.61) (2023-12-29)


### Bug Fixes

* checkbox cannot be selected #382 ([3fb8435](https://github.com/Hufe921/canvas-editor/commit/3fb843570680d1607834b47c5ad86781ea4f5f14)), closes [#382](https://github.com/Hufe921/canvas-editor/issues/382)
* double-click to expand selection boundary error ([0bd4c5c](https://github.com/Hufe921/canvas-editor/commit/0bd4c5cc51eb400e985d77911c37fd02bf574f07))
* elements in the table cannot be selected #378 ([1477bd0](https://github.com/Hufe921/canvas-editor/commit/1477bd0e3f2685753ec66f868d5664ce5c4c85c2)), closes [#378](https://github.com/Hufe921/canvas-editor/issues/378)
* line break error before separator element #379 ([bdb981d](https://github.com/Hufe921/canvas-editor/commit/bdb981d242821d80d3d45f8569badaaa6f3a8a1d)), closes [#379](https://github.com/Hufe921/canvas-editor/issues/379)
* three click selection paragraph boundary error ([56ea7d8](https://github.com/Hufe921/canvas-editor/commit/56ea7d8bb13d6f57e24e15550a81f6e2c947f653))


### Features

* enter to delete list #376 ([f542739](https://github.com/Hufe921/canvas-editor/commit/f542739d3eb1be273e1f77c3a908dab329f8c619)), closes [#376](https://github.com/Hufe921/canvas-editor/issues/376)



## [0.9.60](https://github.com/Hufe921/canvas-editor/compare/v0.9.59...v0.9.60) (2023-12-23)


### Bug Fixes

* clone the values set to the editor #369 (#371) ([f73759f](https://github.com/Hufe921/canvas-editor/commit/f73759fdd75119fdff113d4ec914d5cc20de6dae)), closes [#369](https://github.com/Hufe921/canvas-editor/issues/369) [#371](https://github.com/Hufe921/canvas-editor/issues/371)
* format element list boundary error #367 ([7a6f656](https://github.com/Hufe921/canvas-editor/commit/7a6f6566994245da16d3e3f31186565d99bdcf89)), closes [#367](https://github.com/Hufe921/canvas-editor/issues/367)


### Chores

* insert hyperlink with default value #368 ([d83fc0f](https://github.com/Hufe921/canvas-editor/commit/d83fc0f37a368cb14b631ff10a4618789562d570)), closes [#368](https://github.com/Hufe921/canvas-editor/issues/368)


### Features

* add conceptId attribute to table element ([b55471b](https://github.com/Hufe921/canvas-editor/commit/b55471b13446959e6ac1802d086ab10140a8435d))
* add zone attribute to getRangeContext api ([57fdcb8](https://github.com/Hufe921/canvas-editor/commit/57fdcb8b81079c1fa0836b9092596df986863382))
* add zone tooltip #367 ([095414f](https://github.com/Hufe921/canvas-editor/commit/095414fbe68bdf8c714dea36d7159a16d6ee9349)), closes [#367](https://github.com/Hufe921/canvas-editor/issues/367)


### Performance Improvements

* compute zone tooltip performance ([28ef4af](https://github.com/Hufe921/canvas-editor/commit/28ef4af15e2a873fac021364449725f78c89348f))



## [0.9.59](https://github.com/Hufe921/canvas-editor/compare/v0.9.58...v0.9.59) (2023-12-17)


### Chores

* update default font #360 ([8ace079](https://github.com/Hufe921/canvas-editor/commit/8ace07962da4f7e373c361776233330fdd8e4139)), closes [#360](https://github.com/Hufe921/canvas-editor/issues/360)


### Features

* add  zone attribute to getControlValue api ([285aeec](https://github.com/Hufe921/canvas-editor/commit/285aeec2f6eeba676361b109e595744c2f1e4641))
* add resizer size Indicator ([61c110d](https://github.com/Hufe921/canvas-editor/commit/61c110d5eed09197fb2187e6ecec2ee9a10d0d27))
* set control highlight rule #332 ([b6fe212](https://github.com/Hufe921/canvas-editor/commit/b6fe21230b34afa6ac53eee146e1c291a22da04e)), closes [#332](https://github.com/Hufe921/canvas-editor/issues/332)



## [0.9.58](https://github.com/Hufe921/canvas-editor/compare/v0.9.57...v0.9.58) (2023-12-08)


### Bug Fixes

* empty list don't render placeholder ([910f756](https://github.com/Hufe921/canvas-editor/commit/910f75662f62dc38f068a71feb4cd68150b83341))
* multiple empty lists render error in first row ([1487033](https://github.com/Hufe921/canvas-editor/commit/1487033d75e7c94c2fdf748217f79642181eaaf1))
* not render margin indicator in print mode #354 ([3f1babe](https://github.com/Hufe921/canvas-editor/commit/3f1babec68b5d22babade28214ca9a7212d3cf8a)), closes [#354](https://github.com/Hufe921/canvas-editor/issues/354)
* repeated input in firefox browser #357 ([6de3ad8](https://github.com/Hufe921/canvas-editor/commit/6de3ad8b21b557ddc9e218d22b283348dcbd9211)), closes [#357](https://github.com/Hufe921/canvas-editor/issues/357)


### Chores

* export splitText function ([bcbd879](https://github.com/Hufe921/canvas-editor/commit/bcbd879e0f44443f0bcac71402330b37def434b2))
* update eslint fixAll option ([bba0b09](https://github.com/Hufe921/canvas-editor/commit/bba0b090f33e4f3e391a14e22c2b579f132b5348))


### Features

* add control indentation option #345 ([5f1cf3a](https://github.com/Hufe921/canvas-editor/commit/5f1cf3ab37aa22180eee45c02486b478dfbc6b99)), closes [#345](https://github.com/Hufe921/canvas-editor/issues/345)



## [0.9.57](https://github.com/Hufe921/canvas-editor/compare/v0.9.56...v0.9.57) (2023-12-03)


### Bug Fixes

* disable focus in readonly mode #326 ([f0823d7](https://github.com/Hufe921/canvas-editor/commit/f0823d7a6b5e975b60affeea5aae626e14162dc7)), closes [#326](https://github.com/Hufe921/canvas-editor/issues/326)
* scaling table and separator elements error #326 ([b3354ac](https://github.com/Hufe921/canvas-editor/commit/b3354ac35ff34031b3dcbeab293b69b7686afdf2)), closes [#326](https://github.com/Hufe921/canvas-editor/issues/326)
* unable to copy elements in control #347 ([6ca1919](https://github.com/Hufe921/canvas-editor/commit/6ca1919498328d3154865469943bde06deb5e465)), closes [#347](https://github.com/Hufe921/canvas-editor/issues/347)
* underline position of superscript and subscript elements is error #268 ([90efe10](https://github.com/Hufe921/canvas-editor/commit/90efe1020fa801c64849b68b15580aa3b505d1cf)), closes [#268](https://github.com/Hufe921/canvas-editor/issues/268)


### Chores

* upgrade cypress version ([ecd4ae9](https://github.com/Hufe921/canvas-editor/commit/ecd4ae9652a9e819bc2a02f2f735d5b5bde9bc71))


### Features

* add control disabled rule ([1455a2a](https://github.com/Hufe921/canvas-editor/commit/1455a2afb2949b7db10a3cfa30258e0f03bcbf31))
* add range and position context api ([8acce15](https://github.com/Hufe921/canvas-editor/commit/8acce15e767aa14a80dfe88e596986f3cba9ad63))
* add set active zone api ([6b30e3c](https://github.com/Hufe921/canvas-editor/commit/6b30e3ca9d48cb45cfe082b55dcf11c8287c36ee))
* limit the max cursor offsetHeight #348 ([2666bc4](https://github.com/Hufe921/canvas-editor/commit/2666bc43c3e6eca26f51e6317afcb2b02805dad4)), closes [#348](https://github.com/Hufe921/canvas-editor/issues/348)



## [0.9.56](https://github.com/Hufe921/canvas-editor/compare/v0.9.55...v0.9.56) (2023-11-14)


### Bug Fixes

* compute table row and col info boundary error #324 ([455b397](https://github.com/Hufe921/canvas-editor/commit/455b397fbc5de18ffe5a22bc9f9f68e23f9874eb)), closes [#324](https://github.com/Hufe921/canvas-editor/issues/324)
* get and set control property in table #323 ([17cd6cc](https://github.com/Hufe921/canvas-editor/commit/17cd6ccd09e7c368e2ef98c0be2b8de526e8a4c3)), closes [#323](https://github.com/Hufe921/canvas-editor/issues/323)



## [0.9.55](https://github.com/Hufe921/canvas-editor/compare/v0.9.54...v0.9.55) (2023-11-10)


### Bug Fixes

*  break after pasting HTML #318 ([80f6531](https://github.com/Hufe921/canvas-editor/commit/80f6531b96e22b434cd10b4441dba86c8944f99b)), closes [#318](https://github.com/Hufe921/canvas-editor/issues/318)
* delete table row boundary error #313 ([8f8bc04](https://github.com/Hufe921/canvas-editor/commit/8f8bc046db60a7c66c3b17e61b1f9f5a5c731f58)), closes [#313](https://github.com/Hufe921/canvas-editor/issues/313)
* reset event ability after delete element #314 ([c6483a4](https://github.com/Hufe921/canvas-editor/commit/c6483a4da68881490cc25c52cafcf96386d9a0a6)), closes [#314](https://github.com/Hufe921/canvas-editor/issues/314)
* shrink control range boundary error #305 ([a9fc226](https://github.com/Hufe921/canvas-editor/commit/a9fc226a39c3ef78d217fe7435b4b463c5879eac)), closes [#305](https://github.com/Hufe921/canvas-editor/issues/305)


### Features

* add pageScaleChange eventbus #321 ([c697586](https://github.com/Hufe921/canvas-editor/commit/c69758686de22328ac84138ed2c2aa9a0668ed78)), closes [#321](https://github.com/Hufe921/canvas-editor/issues/321)
* add scrollContainerSelection option #320 ([192113e](https://github.com/Hufe921/canvas-editor/commit/192113e271b02cf3e4a462343a7b3d5604b90b23)), closes [#320](https://github.com/Hufe921/canvas-editor/issues/320)
* collapsed selection rect information ([7c32f95](https://github.com/Hufe921/canvas-editor/commit/7c32f9572f4d29fbf2f5d6d3f775c5dbe2d0ba8b))
* support for paste richtext data in contextmenu ([8989831](https://github.com/Hufe921/canvas-editor/commit/8989831474f637fe52133abc85d1ed2dc41f6354))



## [0.9.54](https://github.com/Hufe921/canvas-editor/compare/v0.9.53...v0.9.54) (2023-11-03)


### Bug Fixes

* clone payload data when call add element api #308 ([aeefca3](https://github.com/Hufe921/canvas-editor/commit/aeefca34caa86f9f52fb742e3f7555cd0364baa4)), closes [#308](https://github.com/Hufe921/canvas-editor/issues/308)
* print error of control assistant components in table #311 ([7fb0150](https://github.com/Hufe921/canvas-editor/commit/7fb0150635f80d62c2c27d2e2c976a3f0fa1deff)), closes [#311](https://github.com/Hufe921/canvas-editor/issues/311)
* set control value error in table #302 ([7fba458](https://github.com/Hufe921/canvas-editor/commit/7fba458d523ae06678557add90dc9d19a3cb02cb)), closes [#302](https://github.com/Hufe921/canvas-editor/issues/302)


### Chores

* update hyperlink spell ([1bde309](https://github.com/Hufe921/canvas-editor/commit/1bde309cb5bcf797416a019f1a1507fd155dbed6))


### Features

* add copy table cell content option to contextmenu #307 ([a94328f](https://github.com/Hufe921/canvas-editor/commit/a94328fa956c5164111c27773f557b9761cd775e)), closes [#307](https://github.com/Hufe921/canvas-editor/issues/307)
* support for insert more elements into control #306 ([d2d649b](https://github.com/Hufe921/canvas-editor/commit/d2d649b01123a13962b5ba45c2982f80cc701306)), closes [#306](https://github.com/Hufe921/canvas-editor/issues/306)



## [0.9.53](https://github.com/Hufe921/canvas-editor/compare/v0.9.52...v0.9.53) (2023-10-26)


### Bug Fixes

* cannot undo and redo in form mode #301 ([22c69ee](https://github.com/Hufe921/canvas-editor/commit/22c69eec728e392346de179086bd90f81486a8c9)), closes [#301](https://github.com/Hufe921/canvas-editor/issues/301)


### Features

* add control deletable rule #301 ([e5acf6e](https://github.com/Hufe921/canvas-editor/commit/e5acf6efcbb719790770978656f01d8597f6a1e8)), closes [#301](https://github.com/Hufe921/canvas-editor/issues/301)
* add executeBlur api #262 ([d9f7d50](https://github.com/Hufe921/canvas-editor/commit/d9f7d5045f956f0c184457562d7d0cbd8bf6033d)), closes [#262](https://github.com/Hufe921/canvas-editor/issues/262)
* add modify internal context menu interface #300 ([0891f05](https://github.com/Hufe921/canvas-editor/commit/0891f053d2279e0db816118e073be9a1e268460a)), closes [#300](https://github.com/Hufe921/canvas-editor/issues/300)
* add override internal copy function api ([45e7eab](https://github.com/Hufe921/canvas-editor/commit/45e7eab119a303482dde317298478fdc41536294))
* add set control extension value api #293 ([096778d](https://github.com/Hufe921/canvas-editor/commit/096778d37c8176bb70c2d7eb4534138b4af5a712)), closes [#293](https://github.com/Hufe921/canvas-editor/issues/293)


### Performance Improvements

* set select control value style #298 ([f4d7554](https://github.com/Hufe921/canvas-editor/commit/f4d75544d0a063a05a06bc5dbac74fd4d176eb5f)), closes [#298](https://github.com/Hufe921/canvas-editor/issues/298)



## [0.9.52](https://github.com/Hufe921/canvas-editor/compare/v0.9.51...v0.9.52) (2023-10-12)


### Bug Fixes

* bounding rect error in getRangeContext api ([06c3a33](https://github.com/Hufe921/canvas-editor/commit/06c3a337aeb1eccf6e7182040e6db1acadc9aee9))
* set range style when on double click ([6f2fb5d](https://github.com/Hufe921/canvas-editor/commit/6f2fb5de0971fc98a585283f5676aed4dcdae1cc))


### Features

* add extend attribute to control element #293 ([0395a72](https://github.com/Hufe921/canvas-editor/commit/0395a72fe6464a78883630abac659aafac11d723)), closes [#293](https://github.com/Hufe921/canvas-editor/issues/293)
* add getContainer api ([c944872](https://github.com/Hufe921/canvas-editor/commit/c944872ae7ccc273508884f103ca0fe1711c5d2c))



## [0.9.51](https://github.com/Hufe921/canvas-editor/compare/v0.9.50...v0.9.51) (2023-10-10)


### Features

* add bounding rect to getRangeContext api ([319da3f](https://github.com/Hufe921/canvas-editor/commit/319da3fca16da7cbfd8a4d6ec7f54079a8f0f38e))
* add table cell slash to contextmenu ([d540195](https://github.com/Hufe921/canvas-editor/commit/d540195dfaa80da05e9d8e2dd4b28c87ab312655))


### Performance Improvements

* contextmenu boundary position ([1ce2e2f](https://github.com/Hufe921/canvas-editor/commit/1ce2e2f44f99f7e409fba38648bd76806aa7042e))



## [0.9.50](https://github.com/Hufe921/canvas-editor/compare/v0.9.49...v0.9.50) (2023-09-28)


### Bug Fixes

* remove block element last line break #287 ([0e67395](https://github.com/Hufe921/canvas-editor/commit/0e6739522d022775e39520a3cb9396531a57bf17)), closes [#287](https://github.com/Hufe921/canvas-editor/issues/287)


### Chores

* update README.md ([5ad1414](https://github.com/Hufe921/canvas-editor/commit/5ad1414d82b88bccdb1779c550b75db28dfc18e7))


### Documentation

* add plugin tips ([acdd107](https://github.com/Hufe921/canvas-editor/commit/acdd1075449a38270e3fe6fd0c9eb75f21c433cb))
* move the cursor shortcut ([33ebc59](https://github.com/Hufe921/canvas-editor/commit/33ebc59c721cffd54c14c51ed5d6174226c8a33b))


### Features

* move the cursor the entire word #281 ([b38e4ed](https://github.com/Hufe921/canvas-editor/commit/b38e4ed0ddaa020c0dcbb0336efa32cc605e281c)), closes [#281](https://github.com/Hufe921/canvas-editor/issues/281)
* paper background color option ([46be700](https://github.com/Hufe921/canvas-editor/commit/46be70072852e6cb2c827d960734b54880fc0681))
* support for table cell slash #290 ([4269628](https://github.com/Hufe921/canvas-editor/commit/4269628cc46e7f9fdf0a9832601b2cf07e429aec)), closes [#290](https://github.com/Hufe921/canvas-editor/issues/290)
* typing on ios devices #286 ([8cf2b19](https://github.com/Hufe921/canvas-editor/commit/8cf2b19d3db2b48b840641c05156d1b3a0297b2b)), closes [#286](https://github.com/Hufe921/canvas-editor/issues/286)



## [0.9.49](https://github.com/Hufe921/canvas-editor/compare/v0.9.48...v0.9.49) (2023-09-16)


### Bug Fixes

* control minimum width when scaling ([05ddc2d](https://github.com/Hufe921/canvas-editor/commit/05ddc2db290e58a4ec0fb1b00ad5d64ce7f4cf3a))
* draw text element letter space error #282 ([c35f8ab](https://github.com/Hufe921/canvas-editor/commit/c35f8ab82c57849269a09fbad9d54d5085065d22)), closes [#282](https://github.com/Hufe921/canvas-editor/issues/282)
* omitObject function missing reference ([c45317e](https://github.com/Hufe921/canvas-editor/commit/c45317eced93e3d79129aea24776a8629d058050))


### Features

* add set and get control value api #278 ([f754741](https://github.com/Hufe921/canvas-editor/commit/f754741f32de6c5d5c27d15dfc9fc31e284d29dc)), closes [#278](https://github.com/Hufe921/canvas-editor/issues/278)
* text element width #277 ([bb64626](https://github.com/Hufe921/canvas-editor/commit/bb646266b10897c3097ada5932f9b7cef317aebe)), closes [#277](https://github.com/Hufe921/canvas-editor/issues/277)


### Performance Improvements

* adjusted the tab draw in the list style #283 ([fc0fdb2](https://github.com/Hufe921/canvas-editor/commit/fc0fdb2fe36966e3b8a51107d9929ca137e5681c)), closes [#283](https://github.com/Hufe921/canvas-editor/issues/283)



## [0.9.48](https://github.com/Hufe921/canvas-editor/compare/v0.9.47...v0.9.48) (2023-09-09)


### Bug Fixes

* control minimum width boundary ([05caccc](https://github.com/Hufe921/canvas-editor/commit/05caccc74c7d723f4ac357d161acf45364368f4b))


### Features

* add control minimum width option ([4b2bbfb](https://github.com/Hufe921/canvas-editor/commit/4b2bbfbe9a9bfe0fcad276dc16eb01b7015e6205))
* custom letter class #279 ([de76977](https://github.com/Hufe921/canvas-editor/commit/de769778c04266ed08c5721a01670cdbf0992d2b)), closes [#279](https://github.com/Hufe921/canvas-editor/issues/279)



## [0.9.47](https://github.com/Hufe921/canvas-editor/compare/v0.9.46...v0.9.47) (2023-09-02)


### Bug Fixes

* format control element default options ([7b07cf3](https://github.com/Hufe921/canvas-editor/commit/7b07cf3eb4d62d867e779b7a1be3fb72fdb7c71a))
* insert tab element with context #265 ([b7a0df8](https://github.com/Hufe921/canvas-editor/commit/b7a0df8b1c7af20d53ed0b22d6f33159aa28e33a)), closes [#265](https://github.com/Hufe921/canvas-editor/issues/265)
* table selection boundary error ([7260b64](https://github.com/Hufe921/canvas-editor/commit/7260b6439bd36f961f545c43e1536b3538dd586a))


### Features

* add forceUpdate api #263 ([bc2f445](https://github.com/Hufe921/canvas-editor/commit/bc2f44547207e74c531ca62d17f26b1496eb9387)), closes [#263](https://github.com/Hufe921/canvas-editor/issues/263)
* add getOptions api ([761fcde](https://github.com/Hufe921/canvas-editor/commit/761fcde91aabe8d90d13ff07e0c1d26798d1edba))
* add override internal function api #260 ([abcaa9b](https://github.com/Hufe921/canvas-editor/commit/abcaa9b51c7d703b18e3141105555811988eebdd)), closes [#260](https://github.com/Hufe921/canvas-editor/issues/260)
* add page break option ([ec627dc](https://github.com/Hufe921/canvas-editor/commit/ec627dc407f419641d8e4436eb984bef0ede77c9))
* add shortcut disable option ([640f262](https://github.com/Hufe921/canvas-editor/commit/640f26292f28c309a1b11b51965938d7a5ab40fe))
* add table td border type ([d8876b1](https://github.com/Hufe921/canvas-editor/commit/d8876b1095f7388700a3155c7af7e7e3ff5da11b))
* copy entire line when cursor is inside ([3c10be2](https://github.com/Hufe921/canvas-editor/commit/3c10be26fb58aa49a340aa72f17e9ff8d1c15e15))


### Refactor

* update tdPadding option format ([752ca43](https://github.com/Hufe921/canvas-editor/commit/752ca43077b4092ba15edf4f650b5e35af8bfa8a))



## [0.9.46](https://github.com/Hufe921/canvas-editor/compare/v0.9.45...v0.9.46) (2023-08-25)


### Bug Fixes

* disable paste in read only mode #260 ([f19077b](https://github.com/Hufe921/canvas-editor/commit/f19077b2ce2ed8450257c29a12c77ec627cdd866)), closes [#260](https://github.com/Hufe921/canvas-editor/issues/260)
* drawing background size error #254 ([01340bb](https://github.com/Hufe921/canvas-editor/commit/01340bb13ce31e51abaac150e5294b7b10e64005)), closes [#254](https://github.com/Hufe921/canvas-editor/issues/254)
* error converting some element types to HTML #257 ([a805590](https://github.com/Hufe921/canvas-editor/commit/a805590696bed12c0b4ececdc7de222f629a8cc9)), closes [#257](https://github.com/Hufe921/canvas-editor/issues/257)


### Features

* add comment demo #238 ([86cdcf3](https://github.com/Hufe921/canvas-editor/commit/86cdcf3481ffcaf4c1acee729d0f7aeb1eaf5dee)), closes [#238](https://github.com/Hufe921/canvas-editor/issues/238)
* add element group ([3e183ae](https://github.com/Hufe921/canvas-editor/commit/3e183aefa574268658760eab202e1188cd5651ed))
* add zone field to contextmenu context ([2064236](https://github.com/Hufe921/canvas-editor/commit/2064236d94258dc97bb5decd14ac309288e35db9))
* get range row and paragraph element list #255 ([9495bfe](https://github.com/Hufe921/canvas-editor/commit/9495bfef397a2d9cb39a674d637d85c05bec2382)), closes [#255](https://github.com/Hufe921/canvas-editor/issues/255)



## [0.9.45](https://github.com/Hufe921/canvas-editor/compare/v0.9.44...v0.9.45) (2023-08-18)


### Bug Fixes

* merge table cell error #241 ([1f552a0](https://github.com/Hufe921/canvas-editor/commit/1f552a05d588da1a661cbc000f36253f8894377c)), closes [#241](https://github.com/Hufe921/canvas-editor/issues/241)
* reduce underline distance #247 ([33bafbd](https://github.com/Hufe921/canvas-editor/commit/33bafbd427d5e80db059886c4b116e4ac97d3cf8)), closes [#247](https://github.com/Hufe921/canvas-editor/issues/247)


### Features

* add getLocale api #248 ([fef6ddf](https://github.com/Hufe921/canvas-editor/commit/fef6ddf7a84f3f40ccf5424b37dfb48b805af7bb)), closes [#248](https://github.com/Hufe921/canvas-editor/issues/248)
* support for inserting for surrogate pair #250 ([8f145e2](https://github.com/Hufe921/canvas-editor/commit/8f145e251b2cfb8ffc14aec66cebda29a6368061)), closes [#250](https://github.com/Hufe921/canvas-editor/issues/250)
* support for inserting standard emoji #245 ([913b853](https://github.com/Hufe921/canvas-editor/commit/913b8538b709aa919cb33411dd24924c03effa81)), closes [#245](https://github.com/Hufe921/canvas-editor/issues/245)
* update emoji regex ([a4f5c94](https://github.com/Hufe921/canvas-editor/commit/a4f5c94c96c6edc4f32049081e8fd6bb563ba708))



## [0.9.44](https://github.com/Hufe921/canvas-editor/compare/v0.9.43...v0.9.44) (2023-08-11)


### Features

* add getText api #240 ([f8fdea6](https://github.com/Hufe921/canvas-editor/commit/f8fdea61fcd45d4d0be143b7c889eba9a72dd35b)), closes [#240](https://github.com/Hufe921/canvas-editor/issues/240)
* add print mode #236 ([fd31b3e](https://github.com/Hufe921/canvas-editor/commit/fd31b3e78c2bbd6701655b060ea50e3c4f070a65)), closes [#236](https://github.com/Hufe921/canvas-editor/issues/236)
* apply style to entire table #232 ([b54b66d](https://github.com/Hufe921/canvas-editor/commit/b54b66d3d4a9e7366cef02add9b897770bac39c5)), closes [#232](https://github.com/Hufe921/canvas-editor/issues/232)



## [0.9.43](https://github.com/Hufe921/canvas-editor/compare/v0.9.42...v0.9.43) (2023-08-04)


### Bug Fixes

* cursor navigation across pages #229 ([a96a77a](https://github.com/Hufe921/canvas-editor/commit/a96a77a237a62f0881a2b106b040f29c840fff58)), closes [#229](https://github.com/Hufe921/canvas-editor/issues/229)


### Features

* add form mode #221 ([94247c3](https://github.com/Hufe921/canvas-editor/commit/94247c324be8bd3688f4098ab9520fc563d20ded)), closes [#221](https://github.com/Hufe921/canvas-editor/issues/221)
* cursor following page scrolling #229 ([3db28cc](https://github.com/Hufe921/canvas-editor/commit/3db28cc04f84af502901da51a14e3f63c8a36964)), closes [#229](https://github.com/Hufe921/canvas-editor/issues/229)



## [0.9.42](https://github.com/Hufe921/canvas-editor/compare/v0.9.41...v0.9.42) (2023-07-31)


### Bug Fixes

* contentChange call error during initialization #224 ([1b25afb](https://github.com/Hufe921/canvas-editor/commit/1b25afb664b6feff8a0e96dda53a0a3b252663c7)), closes [#224](https://github.com/Hufe921/canvas-editor/issues/224)
* control value style not affected by prefix #227 ([cf5dd35](https://github.com/Hufe921/canvas-editor/commit/cf5dd356869ac272dd8d3a1948ff5f4c6536b23d)), closes [#227](https://github.com/Hufe921/canvas-editor/issues/227)
* limit word break element type ([73014dc](https://github.com/Hufe921/canvas-editor/commit/73014dc87be5360ab8f09e211a12b06dfcbb77e2))
* set header and footer data error #224 ([b22f0b4](https://github.com/Hufe921/canvas-editor/commit/b22f0b45418b76ba008a2f6200bf8210f3c6f0dd)), closes [#224](https://github.com/Hufe921/canvas-editor/issues/224)


### Features

* add SetHTML api ([52f7500](https://github.com/Hufe921/canvas-editor/commit/52f7500ae3e27b1746af423dcbf1faffc9134948))



## [0.9.41](https://github.com/Hufe921/canvas-editor/compare/v0.9.40...v0.9.41) (2023-07-27)


### Chores

* add id to style element #219 ([166ff7f](https://github.com/Hufe921/canvas-editor/commit/166ff7f3f90c515487d63c06aca5a1e528a5f51a)), closes [#219](https://github.com/Hufe921/canvas-editor/issues/219)


### Documentation

* support document internationalization #222 ([9f80168](https://github.com/Hufe921/canvas-editor/commit/9f8016884f56431fd29a77241bcc69368ffdbb37)), closes [#222](https://github.com/Hufe921/canvas-editor/issues/222) [#213](https://github.com/Hufe921/canvas-editor/issues/213) [#222](https://github.com/Hufe921/canvas-editor/issues/222)


### Features

* add event bus ([0bacc11](https://github.com/Hufe921/canvas-editor/commit/0bacc113cdf8eec3dd01e4dc89937f2538f65e19))
* add getHTML api #218 ([b12c6cc](https://github.com/Hufe921/canvas-editor/commit/b12c6cc4282d5777118c9d2e177f0198af048989)), closes [#218](https://github.com/Hufe921/canvas-editor/issues/218)
* clear contextmenu side effect in web component #219 ([fc356c7](https://github.com/Hufe921/canvas-editor/commit/fc356c7eb66b92fc418838f218ac45f383525573)), closes [#219](https://github.com/Hufe921/canvas-editor/issues/219)
* clear side effect in web component #219 ([ce70f0d](https://github.com/Hufe921/canvas-editor/commit/ce70f0d7e8cd4f997191c88dd4462b6903f09104)), closes [#219](https://github.com/Hufe921/canvas-editor/issues/219)



## [0.9.40](https://github.com/Hufe921/canvas-editor/compare/v0.9.39...v0.9.40) (2023-07-21)


### Bug Fixes

* disable partial contextmenu in readonly mode ([3f03d88](https://github.com/Hufe921/canvas-editor/commit/3f03d88443c2d5c746ba3c77f6e5fc69464c7c3c))


### Performance Improvements

* cursor drawing when page visible ([9c2bd33](https://github.com/Hufe921/canvas-editor/commit/9c2bd33b7a3cd7b557723e9c18870dcd8d7bba6b))
* cursor position at the beginning of a line ([1bd2e45](https://github.com/Hufe921/canvas-editor/commit/1bd2e455a5f5c0bd53cb51d30e8205cd6a148e7c))
* print quality #185 ([842b4fc](https://github.com/Hufe921/canvas-editor/commit/842b4fca0723bf764c8fb05f04a5511c443169db)), closes [#185](https://github.com/Hufe921/canvas-editor/issues/185)


### Refactor

* add prettier and format ([d464c50](https://github.com/Hufe921/canvas-editor/commit/d464c5043508c63b29174ae05bc37ec66c87d45f))



## [0.9.39](https://github.com/Hufe921/canvas-editor/compare/v0.9.38...v0.9.39) (2023-07-14)


### Documentation

* add clean mode remark #214 ([abcc241](https://github.com/Hufe921/canvas-editor/commit/abcc2417966dfa6a43246e3b33dfc39fc65595be)), closes [#214](https://github.com/Hufe921/canvas-editor/issues/214)


### Features

* add table row and col size option #214 ([8d1100c](https://github.com/Hufe921/canvas-editor/commit/8d1100cdb1646bf8822112993c00881cf9e39a5e)), closes [#214](https://github.com/Hufe921/canvas-editor/issues/214)
* get range context info ([09c4d53](https://github.com/Hufe921/canvas-editor/commit/09c4d53bca9744b115b5e7c94a42ebe81da487b8))



## [0.9.38](https://github.com/Hufe921/canvas-editor/compare/v0.9.37...v0.9.38) (2023-07-12)


### Bug Fixes

* limit word break element type #212 ([d7424f8](https://github.com/Hufe921/canvas-editor/commit/d7424f8b8798cc889df3b54748523c1367af2776)), closes [#212](https://github.com/Hufe921/canvas-editor/issues/212)


### Chores

* add plugin tip ([8c6eee1](https://github.com/Hufe921/canvas-editor/commit/8c6eee1a57f5130919d1bdfa6a1067615f3a95e3))
* update README.md ([ccb1aa7](https://github.com/Hufe921/canvas-editor/commit/ccb1aa70abacd9398f9ff0e5b066ad51cfc27274))
* update release script ([4d1ad65](https://github.com/Hufe921/canvas-editor/commit/4d1ad650746ff2c4aa58dde2b725704ab9e7a639))


### Features

* add word break option #212 ([d471165](https://github.com/Hufe921/canvas-editor/commit/d471165430e27e5322160e22da5a5f53fc969b0f)), closes [#212](https://github.com/Hufe921/canvas-editor/issues/212)
* get page value and append element api #211 ([85a9dcb](https://github.com/Hufe921/canvas-editor/commit/85a9dcbcf29a2fc0e1f89293c4f3ecbc976868b7)), closes [#211](https://github.com/Hufe921/canvas-editor/issues/211)



## [0.9.37](https://github.com/Hufe921/canvas-editor/compare/v0.9.36...v0.9.37) (2023-07-02)


### Chores

* add plugin demo ([107c4b8](https://github.com/Hufe921/canvas-editor/commit/107c4b86a8703bd1ab01ab7fc9d3cc8a1078591d))
* update next features roadmap ([ca28454](https://github.com/Hufe921/canvas-editor/commit/ca284540493b985081c86623b569eeef4bf9dcdc))


### Documentation

* add plugin ([d0e1c9b](https://github.com/Hufe921/canvas-editor/commit/d0e1c9b5267e15c0afa94bbd400502735846050b))


### Features

* add fallback placeholder image ([366374e](https://github.com/Hufe921/canvas-editor/commit/366374eb105a49360f7ddecfdb63420e48254698))
* add plugin interface ([ad0bb32](https://github.com/Hufe921/canvas-editor/commit/ad0bb32b70cd2a7b8cf2c25a83091e92cc13f53b))
* add setValue command api #210 ([193bd21](https://github.com/Hufe921/canvas-editor/commit/193bd21f7049a565abddd3ae9be761d95d49fea1)), closes [#210](https://github.com/Hufe921/canvas-editor/issues/210)
* smooth signature drawing ([c328778](https://github.com/Hufe921/canvas-editor/commit/c3287783abfb27670e3572db8c431f23cc04c6ce))



## [0.9.36](https://github.com/Hufe921/canvas-editor/compare/v0.9.35...v0.9.36) (2023-06-16)


### Bug Fixes

* close toolbar menu when click outside #192 ([9c39c54](https://github.com/Hufe921/canvas-editor/commit/9c39c540ff4a2a2f3806f8cea6b053bc6f2e7279)), closes [#192](https://github.com/Hufe921/canvas-editor/issues/192)
* copy highlight element #193 ([88ebfd2](https://github.com/Hufe921/canvas-editor/commit/88ebfd2f74b4cb1f3686478d0bba6a8231020ccb)), closes [#193](https://github.com/Hufe921/canvas-editor/issues/193)
* inability to select list pasted into table #206 ([53dd962](https://github.com/Hufe921/canvas-editor/commit/53dd9628caa8de064f6e87bef905113947273d84)), closes [#206](https://github.com/Hufe921/canvas-editor/issues/206)
* multiple editor instances conflict #205 ([68bea13](https://github.com/Hufe921/canvas-editor/commit/68bea13333a2ea10ec537700a8fd6e9295d963fb)), closes [#205](https://github.com/Hufe921/canvas-editor/issues/205)
* not allow change zone in continuous mode #201 ([16c2e9a](https://github.com/Hufe921/canvas-editor/commit/16c2e9a6d7d325aa33a8e8b5aec518f9e9d3861a)), closes [#201](https://github.com/Hufe921/canvas-editor/issues/201)
* prevent page auto scroll when no selection #204 ([183e644](https://github.com/Hufe921/canvas-editor/commit/183e644089f6ec471a9ad26a037873e4b132911d)), closes [#204](https://github.com/Hufe921/canvas-editor/issues/204)
* remove header and footer in continuous mode ([b92bd40](https://github.com/Hufe921/canvas-editor/commit/b92bd407ddc64e5663c24a63a1fb7dadd15fbf58))


### Chores

* update mock data ([2120780](https://github.com/Hufe921/canvas-editor/commit/21207808a3987136f18f3a49b55b909facce54b9))
* update README.md ([7594942](https://github.com/Hufe921/canvas-editor/commit/759494272a64129533f6f74da2ea8760657f0044))


### Documentation

* add editor placeholder ([3a371e6](https://github.com/Hufe921/canvas-editor/commit/3a371e6ee312b7bff8bf8091a42a7ce5df1623bb))
* add word tool ([e4ea580](https://github.com/Hufe921/canvas-editor/commit/e4ea580263443cbc9cb978272d11bf35c8423d11))


### Features

* add editor placeholder ([5ded5c3](https://github.com/Hufe921/canvas-editor/commit/5ded5c3428fc70e6074d9c9101ba34ef7eeb7d19))
* add history max record option #203 ([c467505](https://github.com/Hufe921/canvas-editor/commit/c46750557ad14ec2625d8aaef8a5ae08eb10ac96)), closes [#203](https://github.com/Hufe921/canvas-editor/issues/203)
* add word tool ([2a3c2e2](https://github.com/Hufe921/canvas-editor/commit/2a3c2e2ec674beed8b20f28764e4d1bb636ce83c))


### Performance Improvements

* cursor selection at the beginning of a line #202 ([a133585](https://github.com/Hufe921/canvas-editor/commit/a1335850a3f0ce1b90a2bf13ad8532f0ccf06cff)), closes [#202](https://github.com/Hufe921/canvas-editor/issues/202)
* range style callback and inactive cursor style #204 ([7628eee](https://github.com/Hufe921/canvas-editor/commit/7628eee283da7236961f61c48c42625442ae02ed)), closes [#204](https://github.com/Hufe921/canvas-editor/issues/204)



## [0.9.35](https://github.com/Hufe921/canvas-editor/compare/v0.9.34...v0.9.35) (2023-05-31)


### Chores

* add CRDT CSpell word ([ef31552](https://github.com/Hufe921/canvas-editor/commit/ef315526be244c210b2a2a220dd3bed986660d75))


### Documentation

* starting page number option ([618cb47](https://github.com/Hufe921/canvas-editor/commit/618cb47f77f2aed05d4ca72135ea5312b6d26b00))
* table cell background color ([9225bef](https://github.com/Hufe921/canvas-editor/commit/9225bef99192d8c4848536d973bb2467ea205f27))
* update next features ([c6ea0a6](https://github.com/Hufe921/canvas-editor/commit/c6ea0a655c997645cda6df7ced4377707973680f))


### Features

* copy and paste sub and sup elements ([a500402](https://github.com/Hufe921/canvas-editor/commit/a500402dd401c6eac55222a366f5fc596c27d7c3))
* copy and paste table cell background color ([c97c6ef](https://github.com/Hufe921/canvas-editor/commit/c97c6eff4047a91e68079cc9b228f41e02bef1ab))
* optimize paste title ([bf52e25](https://github.com/Hufe921/canvas-editor/commit/bf52e2588b3af426382334d45d16d1a33510fde1))
* starting page number option ([bfc61a8](https://github.com/Hufe921/canvas-editor/commit/bfc61a8a06b6c2c09fd968767f2a6ccbe280fe55))
* table cell background color ([dbcab3b](https://github.com/Hufe921/canvas-editor/commit/dbcab3b48557f5a4ba77b9e6ec40b7ac8d36cc40))
* unordered list default style ([c8b2a7e](https://github.com/Hufe921/canvas-editor/commit/c8b2a7e59fdd97ac268b0a38e80bac98dfd797ce))



## [0.9.34](https://github.com/Hufe921/canvas-editor/compare/v0.9.33...v0.9.34) (2023-05-16)


### Documentation

* get catalog api ([c2cc8d9](https://github.com/Hufe921/canvas-editor/commit/c2cc8d98d29a472ccbe35aa39893e1dfc8df74e0))
* location catalog api ([402e448](https://github.com/Hufe921/canvas-editor/commit/402e448559a5e2a1d2dd6399889758172651bcef))


### Features

* add catalog demo ([9343afe](https://github.com/Hufe921/canvas-editor/commit/9343afe83136b4e1a23bad813adb5f9cf813604a))
* get catalog api ([237c0f2](https://github.com/Hufe921/canvas-editor/commit/237c0f22cbd26ac737187b8a195bc08665dcc450))
* location catalog api ([535562e](https://github.com/Hufe921/canvas-editor/commit/535562e396ce150916456a0ed791edc4ff208de4))


### Performance Improvements

* optimize cursor blink ([7ad4ba3](https://github.com/Hufe921/canvas-editor/commit/7ad4ba3a2664744bbcee200775028a009fecd5b4))



## [0.9.33](https://github.com/Hufe921/canvas-editor/compare/v0.9.32...v0.9.33) (2023-05-02)


### Bug Fixes

* get range paragraph boundary error ([84b236f](https://github.com/Hufe921/canvas-editor/commit/84b236fe224e48002f7991abefda0c9c646447e2))
* some IME position error #184 ([c5699bc](https://github.com/Hufe921/canvas-editor/commit/c5699bcb4cad9c9dcd7dad9eba00e0dd6d60cf3a)), closes [#184](https://github.com/Hufe921/canvas-editor/issues/184)


### Documentation

* update list schema and shortcut ([98ea30e](https://github.com/Hufe921/canvas-editor/commit/98ea30e203003f5336911a4cb52d5bce6b8e08e5))


### Features

* wrap within list item ([69750a1](https://github.com/Hufe921/canvas-editor/commit/69750a115a5adcc5ab61c69846fcde402d1019b3))



## [0.9.32](https://github.com/Hufe921/canvas-editor/compare/v0.9.31...v0.9.32) (2023-04-26)


### Bug Fixes

*  not wrap when exceeding container width #177 ([e8f61d9](https://github.com/Hufe921/canvas-editor/commit/e8f61d9d15c1aa5e3179e3565f956382dca9cace)), closes [#177](https://github.com/Hufe921/canvas-editor/issues/177)
* delete list element boundary error ([9a37179](https://github.com/Hufe921/canvas-editor/commit/9a37179c748af63d652735f0ad9e4c5dd65f7e23))
* error when selecting table cells #174 ([f0b6014](https://github.com/Hufe921/canvas-editor/commit/f0b6014daa4ac3ac1d88acb941aa92e183eef6fa)), closes [#174](https://github.com/Hufe921/canvas-editor/issues/174)
* header and footer compute position list error ([3b66b26](https://github.com/Hufe921/canvas-editor/commit/3b66b26c85c59468a5a5c0bfeed39d7bef793239))
* image element row margin error ([3daacc6](https://github.com/Hufe921/canvas-editor/commit/3daacc6cb80506aefd25069f8960766b85e2d88a))
* inline image ascent value ([59065bb](https://github.com/Hufe921/canvas-editor/commit/59065bb29e9e7e85cca83eb6dd5ccdd99533a183))
* paste and format element boundary error ([86569f5](https://github.com/Hufe921/canvas-editor/commit/86569f51d3a32a7c148dbd6f06b5734a98836e68))
* paste list element boundary error ([5935eb7](https://github.com/Hufe921/canvas-editor/commit/5935eb77d04824c60a4e1ffe6149097045188336))
* set paper size  error #181 ([10ada8c](https://github.com/Hufe921/canvas-editor/commit/10ada8cf542e8b8f5ddd9e619637c4d22d66f0b6)), closes [#181](https://github.com/Hufe921/canvas-editor/issues/181)
* tslint error ([8202c1c](https://github.com/Hufe921/canvas-editor/commit/8202c1c67b2ff18feee09223f3f2eea4c8fc7bac))
* unset list error ([c02a96c](https://github.com/Hufe921/canvas-editor/commit/c02a96cb8a24514f8d3aa8386d915e5e9e42050f))


### Chores

* add git pre commit hook ([ef9ee07](https://github.com/Hufe921/canvas-editor/commit/ef9ee07a55b17111011c970adc5f67ee02a93eff))


### Documentation

* add list command ([a5b5f87](https://github.com/Hufe921/canvas-editor/commit/a5b5f8785d598ee632b3fb14ce2bcff93a497ce9))
* update schema, shortcut, option ([2f64395](https://github.com/Hufe921/canvas-editor/commit/2f64395cbdd6b0d4ab04bf40c2e113af7a0fa4c5))


### Features

* adaptive list style during page scaling ([e53c0c5](https://github.com/Hufe921/canvas-editor/commit/e53c0c5d3b1f6e83482ed470d09bb6851600e368))
* add list and title shortcuts ([bb28755](https://github.com/Hufe921/canvas-editor/commit/bb2875516c1339d334068462905e96f28895da6f))
* add list element ([c2330a8](https://github.com/Hufe921/canvas-editor/commit/c2330a8c11d83568f406cbecc8dbad2396d0df40))
* enable keyboard event when image resizer (#179) ([fb78f0a](https://github.com/Hufe921/canvas-editor/commit/fb78f0a0aa4e19e156a09dc530e84bf86e5b861a)), closes [#179](https://github.com/Hufe921/canvas-editor/issues/179)
* handle boundary when dragging elements ([8fba929](https://github.com/Hufe921/canvas-editor/commit/8fba929fb8c0567e195ca9ecdd90f9d677c0aa3e))
* handle list boundary ([406fca3](https://github.com/Hufe921/canvas-editor/commit/406fca359034991fbde568ee3a6f981dac3f73d1))
* header,footer,page number disabled option #180 ([797b9a1](https://github.com/Hufe921/canvas-editor/commit/797b9a14dffa5e3fcdff8bbc5dd9ebc41cc5c7c8)), closes [#180](https://github.com/Hufe921/canvas-editor/issues/180)
* insert table in list element ([3ec7d71](https://github.com/Hufe921/canvas-editor/commit/3ec7d71f2e597841fe063cdd955c36a9d0187339))
* recursion format element context ([9f84285](https://github.com/Hufe921/canvas-editor/commit/9f8428576302a00d182aa3c469def0b6d3d0e708))
* set title at paragraph level ([8a56a49](https://github.com/Hufe921/canvas-editor/commit/8a56a49a0ae23fc59d2edd9ec7894756d36542c7))



## [0.9.31](https://github.com/Hufe921/canvas-editor/compare/v0.9.30...v0.9.31) (2023-04-07)


### Bug Fixes

* lose line break when set title ([722a910](https://github.com/Hufe921/canvas-editor/commit/722a91014508d9a8d65a30ab7d71b23924fa9b91))


### Performance Improvements

* range style anchor element ([d9eec5b](https://github.com/Hufe921/canvas-editor/commit/d9eec5b9be6cbb545c57cf8816b197a214c70f3e))



## [0.9.30](https://github.com/Hufe921/canvas-editor/compare/v0.9.29...v0.9.30) (2023-04-07)


### Bug Fixes

* set defaultTrMinHeight option invalid #168 ([045e2ff](https://github.com/Hufe921/canvas-editor/commit/045e2ffe4ece76d46a8a579fad267f14a6778b1e)), closes [#168](https://github.com/Hufe921/canvas-editor/issues/168)


### Chores

* add image accept values ([189ca73](https://github.com/Hufe921/canvas-editor/commit/189ca73c3213cb9b76fa84df400f9b3624ec0d42))


### Documentation

* add page number format option ([72e97b7](https://github.com/Hufe921/canvas-editor/commit/72e97b7883f0f84961afd7ed93b740d1915f731c))
* add title api and option ([a9b4438](https://github.com/Hufe921/canvas-editor/commit/a9b44387bd174cbd1bab8c308bb732f68800ef34))
* add zone change listener ([3cba30b](https://github.com/Hufe921/canvas-editor/commit/3cba30bcf969a9b777885a4ca6daca3019afd9d0))
* improve editor options ([51d4a03](https://github.com/Hufe921/canvas-editor/commit/51d4a036a0e1c99e48a02b326ab459319536ab7b))


### Features

* add page number format option ([4987723](https://github.com/Hufe921/canvas-editor/commit/4987723f27684a3f4ba4e9952b75c16926f4a07b))
* add title element ([9701b21](https://github.com/Hufe921/canvas-editor/commit/9701b2153e4de71697776765081f39bbfda82eb7))
* add zone change listener ([86871c3](https://github.com/Hufe921/canvas-editor/commit/86871c310be1402f03831ca182698e7ba78a7912))
* format title element value ([1fc276f](https://github.com/Hufe921/canvas-editor/commit/1fc276fbae6a0dd7c8cff39a5c5ca6aa7d7f47ed))


### Performance Improvements

* copy title and table element ([03cd85f](https://github.com/Hufe921/canvas-editor/commit/03cd85f423d207eea7f88c4267552f4af6945030))


### Tests

* add title test case ([c275216](https://github.com/Hufe921/canvas-editor/commit/c275216fb4626e811d702c7f72f1e987823c4787))



## [0.9.29](https://github.com/Hufe921/canvas-editor/compare/v0.9.28...v0.9.29) (2023-04-01)


### Bug Fixes

* delete rowFlex when row position change #164 ([5c3ce57](https://github.com/Hufe921/canvas-editor/commit/5c3ce57c24253cfe9b16ddc682f0f75aaab653fd)), closes [#164](https://github.com/Hufe921/canvas-editor/issues/164)
* failed to execute 'toDataURL' #163 ([f11d5c8](https://github.com/Hufe921/canvas-editor/commit/f11d5c806ea5cc308b59df4eaa58bf82998a3c50)), closes [#163](https://github.com/Hufe921/canvas-editor/issues/163)
* render composing text error ([310e0e9](https://github.com/Hufe921/canvas-editor/commit/310e0e91fbe4ef64343b5cc746ec4e7d471df974))
* table cell text render position error #166 ([266915a](https://github.com/Hufe921/canvas-editor/commit/266915af09be90a1a12092fdff2d266d62f3c90d)), closes [#166](https://github.com/Hufe921/canvas-editor/issues/166)
* table cell vertical align error after page scaled #165 ([1fa1d10](https://github.com/Hufe921/canvas-editor/commit/1fa1d10fc9c279eb1d91b804484019d02fec945d)), closes [#165](https://github.com/Hufe921/canvas-editor/issues/165)


### Documentation

* update snapshot ([e0791cf](https://github.com/Hufe921/canvas-editor/commit/e0791cf5f74341547a86809e80c647a3f0fa5a2a))


### Features

* avoid punctuation at the beginning of a row ([29a988a](https://github.com/Hufe921/canvas-editor/commit/29a988a1d4d57a98068a299986ddbe38a52d80a4))



## [0.9.28](https://github.com/Hufe921/canvas-editor/compare/v0.9.27...v0.9.28) (2023-03-27)


### Bug Fixes

* drag table border to change size #160 ([fda18d9](https://github.com/Hufe921/canvas-editor/commit/fda18d968e7f54c11726dcd11a9d3536bca33d9a)), closes [#160](https://github.com/Hufe921/canvas-editor/issues/160)
* extra blank row appear when insert table #162 ([2f8c6b7](https://github.com/Hufe921/canvas-editor/commit/2f8c6b71d2787e85a677073ca41832c4b00f6c41)), closes [#162](https://github.com/Hufe921/canvas-editor/issues/162)
* position header and footer zone ([ca5c4be](https://github.com/Hufe921/canvas-editor/commit/ca5c4be9c39f374ccbb1bb6ea126b06fa978c885))
* table cell height adaptation #162 ([a2090c8](https://github.com/Hufe921/canvas-editor/commit/a2090c82fc2c09ed28a40064094cbca0b9bd1431)), closes [#162](https://github.com/Hufe921/canvas-editor/issues/162)


### Documentation

* add page footer ([45a17ba](https://github.com/Hufe921/canvas-editor/commit/45a17ba756eb822060aa66370821434d1167be55))
* update editor options ([6351b95](https://github.com/Hufe921/canvas-editor/commit/6351b95646d80dab45cc517c223561aa0e8fc725))


### Features

* add page footer ([21626cc](https://github.com/Hufe921/canvas-editor/commit/21626cc41b24f72c28694881a8aba92fddcccf35))



## [0.9.27](https://github.com/Hufe921/canvas-editor/compare/v0.9.26...v0.9.27) (2023-03-24)


### Chores

* verify release package ([4773c03](https://github.com/Hufe921/canvas-editor/commit/4773c0363ccb15b4ca9b406bb2c888a53c9af777))



## [0.9.26](https://github.com/Hufe921/canvas-editor/compare/v0.9.25...v0.9.26) (2023-03-24)


### Chores

* add release script ([caa2c34](https://github.com/Hufe921/canvas-editor/commit/caa2c3463d6306b49fbfb893dec6caf6a9f16f0d))



## [0.9.25](https://github.com/Hufe921/canvas-editor/compare/v0.9.24...v0.9.25) (2023-03-24)


### Bug Fixes

* table elements position when zooming ([3ff0eea](https://github.com/Hufe921/canvas-editor/commit/3ff0eea9482d5ab868b09940d3ebbb3864c71a2b))
* table tool render option ([4a022a2](https://github.com/Hufe921/canvas-editor/commit/4a022a2724521d842f72f679a3bc8ca2b0e244ea))


### Chores

* add eslint global variable ([70f3d17](https://github.com/Hufe921/canvas-editor/commit/70f3d17ff0e4a4477e5d83f0b9b422f91aee1226))
* add verify git commit message script ([0582da5](https://github.com/Hufe921/canvas-editor/commit/0582da56dde70e1f023f8cd3d8aad64b0e163cc8))
* update .editorConfig ([4c48c79](https://github.com/Hufe921/canvas-editor/commit/4c48c79f71256449a82d50052216c22914b72afe))


### Documentation

* delete headerTop option ([756c706](https://github.com/Hufe921/canvas-editor/commit/756c706b9f5321b67f47be99ec04232339b6fdb5))
* table border type #152 ([9521d59](https://github.com/Hufe921/canvas-editor/commit/9521d59fafe8a5b5a2e66db97128720bc0206d48)), closes [#152](https://github.com/Hufe921/canvas-editor/issues/152)


### Features

* table border tool ([5c529b7](https://github.com/Hufe921/canvas-editor/commit/5c529b76ca8184bed118955fdae36b8f1717dbb9))
* table border type #152 ([48ad18b](https://github.com/Hufe921/canvas-editor/commit/48ad18bccb16e1a7751680103ac52a20320861d8)), closes [#152](https://github.com/Hufe921/canvas-editor/issues/152)



## [0.9.24](https://github.com/Hufe921/canvas-editor/compare/v0.9.23...v0.9.24) (2023-03-22)


### Bug Fixes

* table cell auto height #150 ([e68c0be](https://github.com/Hufe921/canvas-editor/commit/e68c0bebc380f9dd9e870677eac888a7b04c56cb)), closes [#150](https://github.com/Hufe921/canvas-editor/issues/150)
* cannot copy table element when it in the first position ([73457cb](https://github.com/Hufe921/canvas-editor/commit/73457cb2e8cc693138e4785c382ae4c025d8fedd))
* compute only the main body word count ([4306d44](https://github.com/Hufe921/canvas-editor/commit/4306d44ed62a0233fdb0fe9b3c3f7d00423ba4da))
* some IME position error #155 ([b6dfcb5](https://github.com/Hufe921/canvas-editor/commit/b6dfcb5f08f42790395059963b16a57d20367978)), closes [#155](https://github.com/Hufe921/canvas-editor/issues/155)


### Documentation

* table cell vertical align ([47918db](https://github.com/Hufe921/canvas-editor/commit/47918db3bbcf78d4af60e43e7ed1183c5525a758))
* page number options ([c753a9d](https://github.com/Hufe921/canvas-editor/commit/c753a9d00dd3a5bda0b75df7e6237448bd16f21f))
* font size setting api ([690aa1b](https://github.com/Hufe921/canvas-editor/commit/690aa1b96d185ca7d80b9af884d23a39dac9a2bf))
* next features road map ([0e8c5fd](https://github.com/Hufe921/canvas-editor/commit/0e8c5fd388a81fabe28a66cf1239348930ae5346))


### Features

* table cell vertical align contextmenu i18n ([32643a5](https://github.com/Hufe921/canvas-editor/commit/32643a5573660e66fd7084fa33ae599521457ced))
* table cell vertical align ([665e201](https://github.com/Hufe921/canvas-editor/commit/665e2018aaae38aacd6ec9d32980fba245f12ddd))
* page number set row flex ([0a9f44e](https://github.com/Hufe921/canvas-editor/commit/0a9f44eed8fd72ff3318a34222ff91d4f140de9b))
* add fontSize settings API ([d951532](https://github.com/Hufe921/canvas-editor/commit/d95153299880ef7139d3a2d64d7d3dc16fbef615))
* fontSize setting  Example ([3f218f6](https://github.com/Hufe921/canvas-editor/commit/3f218f698bd361ae73eac9043f31585c97058963))


### Performance Improvements

* font size setting api ([84e2fc9](https://github.com/Hufe921/canvas-editor/commit/84e2fc95699adf81fd361ff7a76b900abfd2b164))


### Tests

* font size setting ([89012b7](https://github.com/Hufe921/canvas-editor/commit/89012b7183327f3a5e6497ad96741e6f5badc699))



## [0.9.23](https://github.com/Hufe921/canvas-editor/compare/v0.9.22...v0.9.23) (2023-03-19)


### Bug Fixes

* set editor zone method ([9de29ed](https://github.com/Hufe921/canvas-editor/commit/9de29ed934ffb9556e473911fdb715524f1d2fad))
* table cursor position in page header ([85a2bbe](https://github.com/Hufe921/canvas-editor/commit/85a2bbea60867d4314b571586785ad03dfd716da))


### Documentation

* next features road map ([debc6c1](https://github.com/Hufe921/canvas-editor/commit/debc6c128383a45791763b230d6802b6219d6d8d))
* add page header ([6d47ce0](https://github.com/Hufe921/canvas-editor/commit/6d47ce0a67144a891a3cb16850bfc25396ba3b55))


### Features

* add header indicator ([86707ca](https://github.com/Hufe921/canvas-editor/commit/86707cad47381e8f807aece3ffc76e34f8cffa24))
* zoom page header ([c0fee3e](https://github.com/Hufe921/canvas-editor/commit/c0fee3ea143412928650aa44f4954fe8209ab264))
* export page header type ([23b6cd2](https://github.com/Hufe921/canvas-editor/commit/23b6cd28ad80bf8dc4ecf5968e53909681307c6d))
* paging cursor position ([7b4b33b](https://github.com/Hufe921/canvas-editor/commit/7b4b33b5c5d4b1c27224f7ee25d78f4ba3fe9619))
* page header boundary value ([ed79d25](https://github.com/Hufe921/canvas-editor/commit/ed79d2587ca2932e0c6e1229c72ac24d71d953fc))
* edit page header ([6082ab2](https://github.com/Hufe921/canvas-editor/commit/6082ab26d110d5c90e2742ee51688cdf3e4a41fa))
* render header element ([da2dfd3](https://github.com/Hufe921/canvas-editor/commit/da2dfd3a16d8e87689ea92aae9907cb4f9e21d50))


### Tests

* update get editor value ([436d1de](https://github.com/Hufe921/canvas-editor/commit/436d1de2845599e5767833648ffc836647d7e292))



## [0.9.22](https://github.com/Hufe921/canvas-editor/compare/v0.9.21...v0.9.22) (2023-03-15)


### Bug Fixes

* init page context when paper change ([bb63eeb](https://github.com/Hufe921/canvas-editor/commit/bb63eeb335e45899cf5b6906f26fc1bb7599356e))


### Documentation

* set paper direction api ([0963fc1](https://github.com/Hufe921/canvas-editor/commit/0963fc1adfeda7e3938bf7fbe2bfab1433f401d5))
* update command execute api ([82b5256](https://github.com/Hufe921/canvas-editor/commit/82b525649fea0793fc54897e9befba1b91efe782))
* next features roadmap ([dd7a768](https://github.com/Hufe921/canvas-editor/commit/dd7a7686af40b0a99f388961ff302ea41de4c905))


### Features

* adjust background when paper direction change ([f076f2b](https://github.com/Hufe921/canvas-editor/commit/f076f2bd00eae6f3adf56559e40807898a8de229))
* adjust margins when paper direction change ([1eefa57](https://github.com/Hufe921/canvas-editor/commit/1eefa570b23a3330971c595dde8cef0e6ec2f530))
* add paper direction ([9aeb928](https://github.com/Hufe921/canvas-editor/commit/9aeb928b35c90c0a5a6040b34b77e2d6b91343d5))
* drag and drop date element ([780a40c](https://github.com/Hufe921/canvas-editor/commit/780a40caae3cabd9ceea347ae796ccfda9e9b3ef))



## [0.9.21](https://github.com/Hufe921/canvas-editor/compare/v0.9.20...v0.9.21) (2023-03-11)


### Bug Fixes

* reset canvas context properties that can be overwritten by css #144 ([a3664a2](https://github.com/Hufe921/canvas-editor/commit/a3664a2012ea0ef8bcaa58bd41acd7a6bcd17968)), closes [#144](https://github.com/Hufe921/canvas-editor/issues/144)
* hyperlink popup max width ([1cad605](https://github.com/Hufe921/canvas-editor/commit/1cad605d4f672b8dd01a59ccb55526353e611242))


### Documentation

* next features roadmap ([d86a155](https://github.com/Hufe921/canvas-editor/commit/d86a155159b9f0e768954d3c18a5fccf3c7aba22))
* fix usage errors ([74447a1](https://github.com/Hufe921/canvas-editor/commit/74447a1c5cadaee9fdb9df0116b97cc5e294e016))


### Features

* drag and drop element ([9b9a0a0](https://github.com/Hufe921/canvas-editor/commit/9b9a0a09aeb36c1ae50641cdc8585615a06c28e4))
* render checkbox control with style ([9f64a06](https://github.com/Hufe921/canvas-editor/commit/9f64a068b13b0789dc2974e443ad000655a2c929))



## [0.9.20](https://github.com/Hufe921/canvas-editor/compare/v0.9.19...v0.9.20) (2023-03-08)


### Bug Fixes

* near highlight elements render error ([17b469b](https://github.com/Hufe921/canvas-editor/commit/17b469be6b95621b635383c9fc20c9c0adcb8d2b))


### Chores

* add CHANGELOG.md ([367a247](https://github.com/Hufe921/canvas-editor/commit/367a24730a739514d24d7c882524f8ded479fb38))
* add issue template ([7a26819](https://github.com/Hufe921/canvas-editor/commit/7a268199b3607a8c629fc5bc0242be89abbbac90))


### Features

* signature adapt to high-resolution screen ([4acf243](https://github.com/Hufe921/canvas-editor/commit/4acf243fed01b0b41ebbcc46c4b6603cabf6c825))
* open hyperlink shortcut ([3295e37](https://github.com/Hufe921/canvas-editor/commit/3295e3711ae92f5503064691c5558afea99e3f0c))
* copy and paste highlight element ([0493ae2](https://github.com/Hufe921/canvas-editor/commit/0493ae2d5e10daf917e39a9deb4e29c90e096420))



## [0.9.19](https://github.com/Hufe921/canvas-editor/compare/v0.9.18...v0.9.19) (2023-03-03)


### Bug Fixes

* continuity page render error in lazy mode ([ff06e50](https://github.com/Hufe921/canvas-editor/commit/ff06e50138697ef61ce308e78a7e873046664e30))
* format paste table data ([909096b](https://github.com/Hufe921/canvas-editor/commit/909096bd0d9d6e845ccecbee815ddebe35e6f021))


### Performance Improvements

* improve:control element input ([dc54622](https://github.com/Hufe921/canvas-editor/commit/dc54622258872630ff39309f2b1da3baee1f508f))



## [0.9.18](https://github.com/Hufe921/canvas-editor/compare/v0.9.17...v0.9.18) (2023-03-02)


### Bug Fixes

* scrollbar scroll automatically ([8b5c41b](https://github.com/Hufe921/canvas-editor/commit/8b5c41bd58008a2945574ea178058638b64c0ffb))
* paper remove error in lazy render mode ([8aac99d](https://github.com/Hufe921/canvas-editor/commit/8aac99d5c3a984d8c89b251e53dd393e73c66327))
* cannot paste html at the end of the control #133 ([0694bf0](https://github.com/Hufe921/canvas-editor/commit/0694bf0bec5da94d800affbf60b79a16c7d4d0e1)), closes [#133](https://github.com/Hufe921/canvas-editor/issues/133)
* cannot delete control when it  is first element #131 ([45ef8b6](https://github.com/Hufe921/canvas-editor/commit/45ef8b69540ee28f3d4c3b7cada5fbb44c26a023)), closes [#131](https://github.com/Hufe921/canvas-editor/issues/131)


### Features

* add lazy render mode ([f428f56](https://github.com/Hufe921/canvas-editor/commit/f428f566e9e92c7d4cc2affe73b4fc01eaaa56dd))


### Performance Improvements

* improve:position compute separate from draw row ([8910c7c](https://github.com/Hufe921/canvas-editor/commit/8910c7cf0a5d74f6ec46615bbc106773b3147cdc))



## [0.9.17](https://github.com/Hufe921/canvas-editor/compare/v0.9.16...v0.9.17) (2023-02-28)


### Bug Fixes

* composing input not save history ([c4f2687](https://github.com/Hufe921/canvas-editor/commit/c4f268772646f91d63c224cf72d5e23278ff2f5e))
* visible page computing method ([fcb96a6](https://github.com/Hufe921/canvas-editor/commit/fcb96a6f561d315945c1069b4a47d4f788212556))


### Documentation

* next features road map ([6e99d8a](https://github.com/Hufe921/canvas-editor/commit/6e99d8ad93a7a907fd97a201186b51539980ba55))
* cursor style option ([92d65da](https://github.com/Hufe921/canvas-editor/commit/92d65da7d80e0e312d053006d0690d1f9a258ef4))


### Features

* set the cursor style when dragging text ([2977183](https://github.com/Hufe921/canvas-editor/commit/29771838f0bdc5aef1f5714fd9d6110f482f3f64))



## [0.9.16](https://github.com/Hufe921/canvas-editor/compare/v0.9.15...v0.9.16) (2023-02-21)


### Features

* render composing text ([63487d4](https://github.com/Hufe921/canvas-editor/commit/63487d4f90332be68cb07f3eacfca3a0d04f8eff))
* redraw when device pixel ratio change ([4c370ae](https://github.com/Hufe921/canvas-editor/commit/4c370aec1adbc4056f394d2faf370327fd544e22))
* support mac os shortcut remark ([189e88c](https://github.com/Hufe921/canvas-editor/commit/189e88c5601b2a99b032ae966f945986b8acf8b1))


### Tests

* optimize the method of get editor value ([708d578](https://github.com/Hufe921/canvas-editor/commit/708d57812e6ab145113e3fbab047970d155b515c))



## [0.9.15](https://github.com/Hufe921/canvas-editor/compare/v0.9.14...v0.9.15) (2023-02-16)


### Bug Fixes

* draw multi-segment richtext element in one row ([c522c22](https://github.com/Hufe921/canvas-editor/commit/c522c225b1c26d16abcccd74c0d2573fbeb88595))


### Documentation

* mac os shortcut ([df8096e](https://github.com/Hufe921/canvas-editor/commit/df8096ebfb8259d02f19b1926457d96af574bda2))
* update next features ([338a67c](https://github.com/Hufe921/canvas-editor/commit/338a67c6e7baf38097f1ec801d8292000e94742b))
* update next features ([4cb8d2a](https://github.com/Hufe921/canvas-editor/commit/4cb8d2adf6aa25c7734f3a544e6bbb8a78fe5892))
* add i18n ([c912563](https://github.com/Hufe921/canvas-editor/commit/c9125635eae8cecf4bdeda56455b66221c2f1db3))


### Features

* support mac os shortcut ([ef4bda2](https://github.com/Hufe921/canvas-editor/commit/ef4bda2a46fec7c901fe62abeee4e4315e740643))
* support mac os shortcut ([0d6e0cf](https://github.com/Hufe921/canvas-editor/commit/0d6e0cf4124ddbbc1333a3955acf6aa7b4e159cc))
* support partial fields to set i18n lang ([7287b57](https://github.com/Hufe921/canvas-editor/commit/7287b576e86447ebde026117d0e6068a3dfaf8f6))



## [0.9.14](https://github.com/Hufe921/canvas-editor/compare/v0.9.13...v0.9.14) (2023-02-08)


### Bug Fixes

* get rowFlex when line breaks ([34799d7](https://github.com/Hufe921/canvas-editor/commit/34799d7cb90a5ed2161c219121ca7b4fcd692558))
* paste table data format judgment ([8ff0d01](https://github.com/Hufe921/canvas-editor/commit/8ff0d01dde6f66a5ecdabb89703618f16b86ac75))


### Features

* add i18n ([82b8d2c](https://github.com/Hufe921/canvas-editor/commit/82b8d2c5a965386720e029d52689f97b5c62f0bc))
* paste html with textAlign info ([eb0086a](https://github.com/Hufe921/canvas-editor/commit/eb0086a4b81cd87fdb558e89e92c304f16169cb6))



## [0.9.13](https://github.com/Hufe921/canvas-editor/compare/v0.9.12...v0.9.13) (2023-02-03)


### Bug Fixes

* remove style sheet when paste html ([5bf7029](https://github.com/Hufe921/canvas-editor/commit/5bf7029f0ada5a370f1dfdf6c09b2f977a08609a))
* copy table width colspan and rowspan info ([0f46db1](https://github.com/Hufe921/canvas-editor/commit/0f46db1f8addca04510c683855840770abde69a9))
* adjust selection boundary ([4865eb5](https://github.com/Hufe921/canvas-editor/commit/4865eb5d5a0ded64215a98651ab23dc6404681c2))


### Documentation

* add algolia search ([8177c11](https://github.com/Hufe921/canvas-editor/commit/8177c11c2b4225196aa2a387dcf814fd5af73007))


### Features

* paste table element ([db51a27](https://github.com/Hufe921/canvas-editor/commit/db51a27666e21a942ecabc9c6d5f926ce473fedb))
* paste image element ([0c07db7](https://github.com/Hufe921/canvas-editor/commit/0c07db7a5d53db47117e6fdd11bec995f0a3616b))
* paste separator element ([77d546f](https://github.com/Hufe921/canvas-editor/commit/77d546f476b0009f6925d660cdcbeefd5150b6c2))
* paste checkbox element ([e37da11](https://github.com/Hufe921/canvas-editor/commit/e37da11a79dd5e226f954833b102a8c01a19fef9))
* shrink the contextmenu scope ([64f5ff1](https://github.com/Hufe921/canvas-editor/commit/64f5ff15aa25aaede301277580be0770cec593b0))



## [0.9.12](https://github.com/Hufe921/canvas-editor/compare/v0.9.11...v0.9.12) (2023-01-20)


### Bug Fixes

* adjust selection by shortcut #111 ([a19a0a1](https://github.com/Hufe921/canvas-editor/commit/a19a0a1126f5d8521cde7d53d1042d4fa67ade89)), closes [#111](https://github.com/Hufe921/canvas-editor/issues/111)
* compatible with browsers that do not support ClipboardItem #108 ([196f638](https://github.com/Hufe921/canvas-editor/commit/196f63831849e555d1c24daa78d69e187e642214)), closes [#108](https://github.com/Hufe921/canvas-editor/issues/108)
* line thickness of rendered margin ([e8f3b2a](https://github.com/Hufe921/canvas-editor/commit/e8f3b2a6da725feb014d83ff96ab3c6a68b50655))
* cannot cut whole line except the first page ([ca13a3b](https://github.com/Hufe921/canvas-editor/commit/ca13a3b268791e18d7bc6b0b3297ef0ca5c76387))


### Documentation

* adjust selection by direction key ([01353ad](https://github.com/Hufe921/canvas-editor/commit/01353ad59e208d1db1810f43f868201090273d02))
* adjust selection by shortcut ([81ac4d8](https://github.com/Hufe921/canvas-editor/commit/81ac4d8dc0177090ef11098c9916d156415b5db9))
* add global api ([3678b7f](https://github.com/Hufe921/canvas-editor/commit/3678b7f34b692e9e56141101e2c9e8b2d627a677))
* add docs url to README.md ([a369adb](https://github.com/Hufe921/canvas-editor/commit/a369adbe32c9f0779725a68b3f6b20cc9cfbe5b2))
* update index page ([38cb302](https://github.com/Hufe921/canvas-editor/commit/38cb302fa3a62d5db600ed2df3e8794497a59c52))


### Features

* adjust selection by direction key ([1dfdd9a](https://github.com/Hufe921/canvas-editor/commit/1dfdd9a057f20c0fc512f869b3c914317c0fed85))
* adjust range by shortcut ([4a11bca](https://github.com/Hufe921/canvas-editor/commit/4a11bcacd94a6a0f1340b1741e8ce77d1c6d7e84))
* update server host ([bf93c29](https://github.com/Hufe921/canvas-editor/commit/bf93c2991ad7e657ea63f2ccb84d0ea803609125))
* add docs workflow ([f2374a1](https://github.com/Hufe921/canvas-editor/commit/f2374a14f562d25e9498b4ec0c96da9927849ebb))
* add docs workflow ([7fd0792](https://github.com/Hufe921/canvas-editor/commit/7fd07928b340e3a9795bc4c10d41820d5daffb61))
* add docs ([db52ab8](https://github.com/Hufe921/canvas-editor/commit/db52ab815d708b5f66df0f6661b17e1227067181))
* add font selection and font wysiwyg ([72d6174](https://github.com/Hufe921/canvas-editor/commit/72d6174d7b0b61be8db42dcf7a21512fafbc1f2d))



## [0.9.11](https://github.com/Hufe921/canvas-editor/compare/v0.9.10...v0.9.11) (2022-12-25)


### Features

* optimize event code structure ([f63affc](https://github.com/Hufe921/canvas-editor/commit/f63affc1c4219ee4d65485d11299dbfee47a8be2))
* add isPointInRange function to Range ([5e9c1ce](https://github.com/Hufe921/canvas-editor/commit/5e9c1ce57774012cb1903c2e97ac87ff42d1e245))
* drag text to editor ([4cf4ea5](https://github.com/Hufe921/canvas-editor/commit/4cf4ea5e45e0ee94a20b53f5e775bba0ef9bacca))
* use selection text when searching ([bcdb234](https://github.com/Hufe921/canvas-editor/commit/bcdb2340ae87dd72831d23b5ac83e984d09842e3))
* add cut row feature to contextmenu ([172cb6d](https://github.com/Hufe921/canvas-editor/commit/172cb6d88cf3069452c012b8a52b18d5dba1ff99))
* cut a whole line when no selection ([2c38f13](https://github.com/Hufe921/canvas-editor/commit/2c38f13113afb0889a3907a825f397de6a877181))



