const transactionSetSigners = (transaction, n) => {
	if (!transaction.instructions || !Array.isArray(transaction.instructions))
		throw new Error(`no instructions in transaction ${n}`);

	for (const instruction of transaction.instructions) {
		let instructionProgrammAddress;
		let instructionNumber;

		try {
			instructionProgrammAddress = instruction.programId.toBase58();
			instructionNumber = instruction.data[0];
		} catch (error) {
			throw new Error(
				`wrong instruction program address or instruction number in transaction ${n}`
			);
		}

		console.log(
			"\x1b[33m%s\x1b[0m",
			`sponsoring instruction:`,
			`${instructionProgrammAddress}:${instructionNumber}`
		);

		switch (`${instructionProgrammAddress}:${instructionNumber}`) {
			case `11111111111111111111111111111111:2`: // SystemProgram transfer
				if (!instruction.keys[0])
					throw new Error(
						`wrong key 0 for 11111111111111111111111111111111:2 instruction`
					);
				instruction.keys[0].isSigner = true;
				break;

			case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${0}`: // VelasAccountProgram initialaze
				if (!instruction.keys[1])
					throw new Error(
						`wrong key 1 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${0} instruction`
					);
				instruction.keys[1].isSigner = true;
				break;

			case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${18}`: // VelasAccountProgram addProgram
				if (!instruction.keys[6])
					throw new Error(
						`wrong key 6 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${18} instruction`
					);
				instruction.keys[6].isSigner = true; //7
				break;

			case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${2}`: // VelasAccountProgram addOperational
				if (!instruction.keys[7])
					throw new Error(
						`wrong key 7 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${2} instruction`
					);
				instruction.keys[7].isSigner = true; //8
				break;

			case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${4}`: // VelasAccountProgram mergeOperational
				if (!instruction.keys[4])
					throw new Error(
						`wrong key 4 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${4} instruction`
					);
				instruction.keys[4].isSigner = true; //6
				break;

			case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${5}`: // VelasAccountProgram replaceOwner
				if (!instruction.keys[2])
					throw new Error(
						`wrong key 2 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${5} instruction`
					);
				if (!instruction.keys[3])
					throw new Error(
						`wrong key 3 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${5} instruction`
					);
				instruction.keys[2].isSigner = true;
				instruction.keys[3].isSigner = true;
				break;

			case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${19}`: // VelasAccountProgram removeProgramPermission
				if (!instruction.keys[3])
					throw new Error(
						`wrong key 3 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${19} instruction`
					);
				instruction.keys[3].isSigner = true;
				break;

			case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${7}`: // VelasAccountProgram removeOperational
				if (!instruction.keys[5])
					throw new Error(
						`wrong key 5 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${7} instruction`
					);
				instruction.keys[5].isSigner = true; //6
				break;

			case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${3}`: // VelasAccountProgram extendOperationalScopes
				if (!instruction.keys[5])
					throw new Error(
						`wrong key 5 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${3} instruction`
					);
				instruction.keys[5].isSigner = true;
				break;

			case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${11}`: // VelasAccountProgram transfer
				if (!instruction.keys[5])
					throw new Error(
						`wrong key 5 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${11} instruction`
					);
				instruction.keys[5].isSigner = true;
				break;

			case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${10}`: // VelasAccountProgram execute
				if (!instruction.keys[4])
					throw new Error(
						`wrong key 4 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${10} instruction`
					);
				instruction.keys[4].isSigner = true;
				break;

			case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${20}`: // VelasAccountProgram SponsorAndExecute
				if (!instruction.keys[6])
					throw new Error(
						`wrong key 6 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${20} instruction`
					);
				if (!instruction.keys[7])
					throw new Error(
						`wrong key 7 for ${
							process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS
						}:${20} instruction`
					);
				instruction.keys[6].isSigner = true;
				instruction.keys[7].isSigner = true;
				break;

			case `GW5kcMNyviBQkU8hxPBSYY2BfAhXbkAraEZsMRLE36ak:${instructionNumber}`: // Memo instruction
				break;

			default:
				throw new Error(
					`Instruction ${instructionProgrammAddress}:${instructionNumber} is not supported by sponsor.`
				);
		}
	}

	return transaction;
};

export default transactionSetSigners;
