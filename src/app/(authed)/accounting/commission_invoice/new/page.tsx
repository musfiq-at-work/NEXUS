'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useCommissionInvoiceForm } from "../config/useCommissionInvoiceForm";
import { useRouter } from "next/navigation";
import { safeNumber } from "~/utils/numbers";